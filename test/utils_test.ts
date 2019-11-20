
import * as assert from 'assert';
import * as utils from '../lib/utils';
import * as bsv from 'bsv';

describe("Various Utilities for Bcat", () => {

  describe("Dummy Data", () => {

    it("#getDummyUTXO should return a bsv output script", async () => {

      let output = await utils.getDummyUTXO();

      assert(output instanceof bsv.Transaction.UnspentOutput);

    });

  });

  describe("Generic Sleep", () => {

    it("#sleep should sleep for milliseconds specified", async () => {

      await utils.sleep(10);

    });

  });

});

