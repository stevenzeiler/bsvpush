
import * as bsv from 'bsv';
import { bitindex } from './bitindex';

export function getDummyUTXO() {
  return bsv.Transaction.UnspentOutput({
    address: '19dCWu1pvak7cgw5b1nFQn9LapFSQLqahC',
    txId: 'e29bc8d6c7298e524756ac116bd3fb5355eec1da94666253c3f40810a4000804',
    outputIndex: 0,
    satoshis: 5000000000,
    scriptPubKey: '21034b2edef6108e596efb2955f796aa807451546025025833e555b6f9b433a4a146ac'
  });
}

export async function findUtxo(publicKey: string, txid: string, voutIndex: number) {
  const utxos = await bitindex.address.getUtxos(publicKey);
  return utxos.find(utxo => utxo.txid === txid && utxo.vout === voutIndex);
}

export async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Converts the OP_RETURN payload to hex strings.
 * @param array
 */
export function arrayToHexStrings(array: any[]): string[] {
  return array.map(e => { 
    if (e instanceof Buffer) {
      return e.toString('hex');
    } else if (typeof e === 'number') {
      return e.toString(16).padStart(2, '0');
    } else {
      return Buffer.from(e).toString('hex');
    }
  });
}

export function estimateFee(script: bsv.Script): number {
  //const script = bsv.Script.fromASM(node.opreturn.join(' '));
  if (script.toBuffer().length > 100000) {
    console.log(`Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`);
    process.exit(1);
  }

  const tempTX = new bsv.Transaction().from([getDummyUTXO()]);
  tempTX.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

  // Use the dummy txid for now as it will be used in the children tx size calculations
  return Math.max(tempTX._estimateFee(), this.minimumOutputValue);
}

