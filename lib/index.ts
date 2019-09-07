import * as bsv from 'bsv';

import * as bitcoms from './bitcom';

export const minimumOutputValue = 546;
export const maxFileSize        = 90000;
export const feeb                     = 1.1;

export async function estimateFeesForFile(data: Buffer): Promise<number> {

  const bcatPartFees = [];

  for (let i = 0; i < data.length; i += maxFileSize) {
    const buffer = data.subarray(i, i + maxFileSize);

    const opReturnPayload = [
      bitcoms.bCatPartProtocol,   // Bcat:// part
      buffer                   // data
    ];

    const opReturn = ['OP_RETURN', ...arrayToHexStrings(opReturnPayload)];

    // Create transaction
    const script = bsv.Script.fromASM(opReturn.join(' '));
    if (script.toBuffer().length > 100000) {
      console.log(`Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`);
      process.exit(1);
    }

    const tempTX = new bsv.Transaction().from([getDummyUTXO()]);
    tempTX.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

    bcatPartFees.push(Math.max(Math.ceil(tempTX._estimateSize() * feeb), minimumOutputValue));
  }

  return bcatPartFees.reduce((sum, fee) => {
    sum += fee
    return sum;
  }, 0);

}

export async function constructTransactionsForFile(filepath: string) {

  return [];

}


function getDummyUTXO() {
  return bsv.Transaction.UnspentOutput({
    address: '19dCWu1pvak7cgw5b1nFQn9LapFSQLqahC',
    txId: 'e29bc8d6c7298e524756ac116bd3fb5355eec1da94666253c3f40810a4000804',
    outputIndex: 0,
    satoshis: 5000000000,
    scriptPubKey: '21034b2edef6108e596efb2955f796aa807451546025025833e555b6f9b433a4a146ac'
  });
}

/**
 * Converts the OP_RETURN payload to hex strings.
 * @param array
 */
function arrayToHexStrings(array): string[] {
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
