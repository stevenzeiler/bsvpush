
import { query } from './genesis';
import * as constants from './constants';
import * as bsv from 'bsv';
import * as utils from './utils';

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

export async function generateBScript(fundingTx: bsv.Transaction, privateKey: bsv.PrivateKey, data: Buffer, utxo: bsv.Transaction.UnspentOutput) {

  var txs = [];

  for (let i = 0; i < data.length; i += constants.maxFileSize) {

    const buffer = data.subarray(i, i + constants.maxFileSize);

    const opReturnPayload = [
      this.bCatPartProtocol,     // Bcat:// part
      buffer                     // data
    ];

    const opReturn = ['OP_RETURN', ...utils.arrayToHexStrings(opReturnPayload)];

    const script = bsv.Script.fromASM(opReturn.join(' '));

    const tx = new bsv.Transaction().from([utxo]);

    tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

    tx.fee(await utils.estimateFee(script));

    tx.sign(privateKey);

    txs.push(tx);

  }

  return txs;

}

export async function generateBcatScript() {

}


