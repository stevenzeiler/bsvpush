
import * as bcat from '../lib/bcat';

import * as assert from 'assert';

describe("Bcat Utilities", () => {

  describe("Funding Bcat Transactions", () => {

    it("#waitForFundingTransactionToAppear", async () => {

      assert.strictEqual(typeof bcat.waitForFundingTransactionToAppear, 'function');

    });

    it("#waitForUnconfirmedParents", async () => {

      assert.strictEqual(typeof bcat.waitForUnconfirmedParents, 'function');

    });

  });

  describe("Generating Bcat Scripts", () => {

    it("generateBScript", () => {

      assert.strictEqual(typeof bcat.generateBScript, 'function');

    });

    it("generateBcatScript", () => {

      assert.strictEqual(typeof bcat.generateBcatScript, 'function');

    });

    it("generateBcatPartTransactions", () => {

      assert.strictEqual(typeof bcat.generateBcatPartTransactions, 'function');

    });

  });

});
