
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

