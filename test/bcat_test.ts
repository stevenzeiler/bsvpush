
import * as bcat from '../lib/bcat';

import * as assert from 'assert';

describe("Bcat Utilities", () => {

  describe("Funding Bcat Transactions", () => {

    it.skip("#waitForFundingTransactionToAppear", async () => {

      assert.strictEqual(typeof bcat.waitForFundingTransactionToAppear, 'function');

    });

    it.skip("#waitForUnconfirmedParents", async () => {

      assert.strictEqual(typeof bcat.waitForUnconfirmedParents, 'function');

    });

  });

  describe("Generating Bcat Scripts", () => {

    it.skip("generateBScript", () => {

      assert.strictEqual(typeof bcat.generateBcatScript, 'function');

    });

    it.skip("generateBcatScript", () => {

      assert.strictEqual(typeof bcat.generateBScript, 'function');

    });

  });

});
