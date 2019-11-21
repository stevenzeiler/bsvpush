
import * as bsv from 'bsv';
import * as crypto from 'crypto';
import * as utils from './utils';
import { gzipSync } from 'zlib';

import { query } from './genesis';
import * as constants from './constants';
import * as bitcoms from './bitcom';
import { bitindex } from './bitindex';

export async function waitForFundingTransactionToAppear(fundingTx) {

  console.log('Waiting for funding transaction to appear on network...');

  let wait = true;

  while (wait) {

    const json = await query({
      "v": 3,
      "q": {
          "find": {
              "tx.h": fundingTx.id
          },
          "project": {
              "tx.h": 1
          }
      }
    });

    const items = json.u.concat(json.c);

    if (items.length > 0) {

      wait = false;

    } else {

      await utils.sleep(1000);

    }
  }
}

export async function waitForUnconfirmedParents(fundingTx, fundingPublicKeyAddress) {

  await waitForFundingTransactionToAppear(fundingTx);

  console.log('Waiting for unconfirmed parents (Bitcoin has a maximum of 25 unconfirmed parents), which could take several minutes...');

  let previousUnconfirmedOutputs = 0;

  let wait = true;

  while (wait) {

    const json = await query({
      "v": 3,
      "q": {
          "db": ["u"],
          "find": {
              "in.e.a": fundingPublicKeyAddress
          },
          "project": {
              "tx.h": 1,
              "out.i": 1
          }
      }
    });

    // Count unconfirmed outputs
    const unconfirmedOutputs = json.u.reduce((count, tx) => count + tx.out.length, 0);

    if (unconfirmedOutputs < 25) {

      wait = false;

    } else {

      if (unconfirmedOutputs !== previousUnconfirmedOutputs) {

        previousUnconfirmedOutputs = unconfirmedOutputs;

      }
  
      await utils.sleep(1000);
    }
  }
}

export async function generateBScript(data: Buffer) {

  let mediaType = ' ';
  let encoding = ' ';

  if (data.length > constants.gzipThreshold) {
    // Only compress if the compressed size is less than the original size
    const compressed = gzipSync(data);
    if (compressed.length < data.length) {
      data = compressed;
      mediaType = 'application/x-gzip'; // For compatibility with Bico.Media
      encoding = 'gzip';
    }
  }

  const algorithm = 'SHA512';
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  const digest = hash.digest('hex');
  //console.log(`File '${name}' ${algorithm} digest: ${digest}`);

  let name = 'unnamedfile';

  const opReturnPayload = [
    bitcoms.bFileProtocol,// B:// format
    data,                 // Data
    mediaType,            // Media Type
    encoding,             // Encoding
    name                 ,// Filename
    '|',                  // Pipe
    bitcoms.dipProtocol,  // Data Integrity Protocol, file hash
    algorithm,            // Integrity check algorithm
    digest,
    0x01,                 // Explicit field encoding
    0x05                  // Hash the B:// data field
  ];

  let opreturn = ['OP_RETURN', ...utils.arrayToHexStrings(opReturnPayload)];

  const script = bsv.Script.fromASM(opreturn.join(' '));

  return script;

}

export async function generateBcatPartTransactions(data: Buffer, privateKey: bsv.PrivateKey) {

  var txs = [];

  for (let i = 0; i < data.length; i += constants.maxFileSize) {

    const buffer = data.subarray(i, i + constants.maxFileSize);

    const opReturnPayload = [
      this.bCatPartProtocol,     // Bcat:// part
      buffer                     // data
    ];

    const opReturn = ['OP_RETURN', ...utils.arrayToHexStrings(opReturnPayload)];

    const script = bsv.Script.fromASM(opReturn.join(' '));

    // TODO FIND UTXO FOR TRANSACTION
    //

    let utxo = await utils.getDummyUTXO();

    const tx = new bsv.Transaction().from([utxo]);

    tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

    tx.fee(await utils.estimateFee(script));

    tx.sign(privateKey);

    txs.push(tx);

  }

  return txs;

}

export function generateBcatScript(data: Buffer, parts: bsv.Transaction[]): any[] {

  const algorithm = 'SHA512';
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  const digest = hash.digest('hex');
  //console.log(`File '${name}' ${algorithm} digest: ${digest}`);

  let name = 'unnamedfile';

  const opReturnPayload = [
    bitcoms.bCatProtocol,   // Bcat:// format
    ' ',                 // Info
    ' ',                 // MIME Type
    ' ',                 // Encoding
    name,                // Filename
    ' '                  // Flag
  ];

  // Add dummy txids to the payload, for size estimation
  parts.forEach(() => opReturnPayload.push('e29bc8d6c7298e524756ac116bd3fb5355eec1da94666253c3f40810a4000804'));

  const dip = [
    '|',                  // Pipe
    bitcoms.dipProtocol, // Data Integrity Protocol, file hash
    algorithm,            // Integrity check algorithm
    digest,
    0x01,                 // Explicit field encoding
    0x05                  // Hash the B:// data field
  ];

  return ['OP_RETURN', ...utils.arrayToHexStrings([...opReturnPayload, ...dip])];
}

interface BuildBTransaction {
  privateKey?: bsv.PrivateKey
}

export async function buildBTransaction(buffer: Buffer, utxos: any, options?: BuildBTransaction):
  Promise<bsv.Transaction> {

  if (!options.privateKey) {

    options.privateKey = new bsv.PrivateKey(process.env.BSV_PRIVATE_KEY);
  }

  let script = await generateBScript(buffer);


  const tx = new bsv.Transaction()
    .from(utxos)
    .change(options.privateKey.publicKey.toAddress())
    .addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }))

  const fee = Math.ceil(tx._estimateSize() * constants.feeb);

  tx.fee(fee)
    .sign(options.privateKey);

  return tx;

}

export async function buildBCatTransactions(data: Buffer, utxos, options: any = {}): Promise<any[]> {
  var bcatParts = [];

  for (let i = 0; i < data.length; i += constants.maxFileSize) {
    const buffer = data.subarray(i, i + constants.maxFileSize);

    const opReturnPayload = [
      bitcoms.bCatPartProtocol,   // Bcat:// part
      buffer                   // data
    ];

    const opReturn = ['OP_RETURN', ...utils.arrayToHexStrings(opReturnPayload)];

    // Create transaction
    const script = bsv.Script.fromASM(opReturn.join(' '));
    if (script.toBuffer().length > 100000) {
      console.log(`Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`);
      process.exit(1);
    }

    const tempTX = new bsv.Transaction().from([utils.getDummyUTXO()]);
    tempTX.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

    let fee = Math.max(Math.ceil(tempTX._estimateSize() * constants.feeb), constants.minimumOutputValue);

    bcatParts.push({ fee, opReturn });

  }

  return [{}, bcatParts];

}

export async function publishTransaction(transaction: bsv.Transaction) {

  const response = await bitindex.tx.send(transaction.toString());

  return response;

}


export function isBcatRequired(buffer: Buffer) {

  return buffer.byteLength  > constants.maxFileSize;

}

export async function createFundingTransaction(fees, privateKey: bsv.PrivateKey) {

  const address = privateKey.publicKey.toAddress().toString();
  const utxos = await bitindex.address.getUtxos(address);

  if (utxos.length === 0) {
    throw `No UTXOs available from funding key. Add new funds to: ${address}`;
  }

  const tx = new bsv.Transaction()
    .from(utxos)
    .change(address);

  fees.forEach(entry => {
    tx.to(address, entry.fee);
  });

  const fee = Math.ceil(tx._estimateSize() * constants.feeb);

  tx.fee(fee);

  tx.sign(privateKey);

  return tx;

}


