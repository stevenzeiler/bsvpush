#!/usr/bin/env node

import { clone } from './clone';
import { push } from './push';
import { estimateFeesForFile } from '../lib';
import * as fs from 'fs';
import { convertSatoshis } from '../lib/prices';

import * as commander from 'commander';

commander
  .command('clone <txid>')
  .action(async (txid) => {
    await clone.clone(txid);
    process.exit(0);
  });

commander
  .command('init')
  .action(async () => {
    push.init();
    process.exit(0);
  });

commander
  .command('upload <filepath>')
  .option('-d, --dryrun')
  .action(async (filepath, options) => {

    if (options.dryrun) {

      console.log("DRY RUN WILL NOT SEND");

    }

    let buffer = fs.readFileSync(filepath);
    let fees = await estimateFeesForFile(buffer);

    let dollars = await convertSatoshis(fees, 'USD');

    console.log(`It will cost ${fees} satoshis ($ ${dollars}) to upload ${filepath}`);

    process.exit(0);

  });

commander.parse(process.argv);

