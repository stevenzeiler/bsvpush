
import { query } from './genesis';
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

export async function generateBScript() {

}

export async function generateBcatScript() {

}


