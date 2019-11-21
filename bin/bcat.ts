#!/usr/bin/env ts-node

require('dotenv').config();

import * as bcat from '../lib/bcat';
import * as bsvpush from '../lib/bsvpush';

import { bitindex } from '../lib/bitindex';

import * as bsv from 'bsv';
import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';

program
  .command('upload <filepath>')
  .action(async (filepath) => {

    const privateKey = new bsv.PrivateKey(process.env.BSV_PRIVATE_KEY);

    const address = privateKey.publicKey.toAddress().toString();

    const utxos = await bitindex.address.getUtxos(address);

    if (utxos.length === 0) {
      throw new Error(`no unspent outputs available for ${address}`)
    }

    try {

      if (!filepath.match(/^\//)) {

        filepath = path.join(process.cwd(), filepath);

      }

      let buffer = fs.readFileSync(filepath);

      if (bcat.isBcatRequired(buffer)) {

        console.log(utxos);

        let [index, parts] = await bcat.buildBCatTransactions(buffer, utxos, {
          // options
        });

        console.log('PARTS', parts.map(p => p.fee));

        let fundingTx = await bcat.createFundingTransaction(parts, privateKey);

        console.log('funding tx', fundingTx);

        console.log(fundingTx.toString());
        console.log(fundingTx.toJSON());

        let resp = await bcat.publishTransaction(fundingTx);

        console.log('broadcast', resp);

        console.log(`${parts.length} bcat parts`);
        console.log(`${utxos.length} outputs ready`);

        /*
        for (let transaction of parts) {

          await bcat.publishTransaction(transaction);
        }
         */

        process.exit(1);

      } else {

        // get utxo by creating a funding transaction or using
        // an existing utxo
        console.log('utxos', utxos);

        let tx = await bcat.buildBTransaction(buffer, utxos, {
          // BuildBTransaction
          privateKey

        });

        console.log(tx);

        let resp = await bcat.publishTransaction(tx);

        console.log('published', resp);
      }

    } catch(error) {

      console.error(error.message);
      process.exit(1);

    }

  });

program
  .command('init')
  .action(() => {

    bsvpush.init();
  
  });

program
  .parse(process.argv);
/*

void (async () => {
  switch (process.argv[2]) {
    case 'init':
      push.init();
      break;
    case 'clone':
      if (process.argv.length < 4) {
        console.log('Clone requires a transaction id as an argument: ');
        console.log('\tbsvpush clone txid');
        process.exit(1);
      }
      const txid = process.argv[3];
      await clone.clone(txid);
      break;
    case 'help':
      console.log('Use one of the following:');
      console.log('\tbsvpush init');
      console.log('\tbsvpush clone txid');
      console.log('\tbsvpush push');
      break;
    case 'push':
    case undefined:
      try {
        await push.push();
      } catch (e) {
        console.log(e);
      }
      break;
  }
})();
*/

