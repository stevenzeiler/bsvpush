#!/usr/bin/env ts-node

import { clone } from '../src/clone';
import { push } from '../src/push';

import * as bsvpush from '../lib/bsvpush';

import * as program from 'commander';

program
  .command('init')
  .action(() => {

    bsvpush.init();
  
  });

program
  .command('clone')
  .action(async (txid) => {

    await clone(txid);

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

