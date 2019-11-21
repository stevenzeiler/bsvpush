import * as path from 'path';
import * as fs from 'fs';
import * as bsv from 'bsv';

export async function clone() {

}

export async function init() {

  /**
   * Creates any directories and files used by bsvpush if they don't already exist.
   * .bsvpush
   * .bsvpush/metanet.json
   * .bsvpush.json
   * HOME/.bsvpush
   * HOME/.bsvpush/funding_key
   *
   * Appends .bsvpush directory to .gitignore as a safety measure, as .bsvpush/metanet.json
   * includes the metanet master private key.
   */
  const bsvignore = path.join(process.cwd(), '.bsvignore');
  if (!fs.existsSync(bsvignore)) {
    console.log(`Creating: ${bsvignore}`);
    const contents = `.bsvpush
.git`;
    fs.writeFileSync(bsvignore, contents);
  }

  const bsvpushDir = path.join(process.cwd(), '.bsvpush');
  if (!fs.existsSync(bsvpushDir)) {
    console.log(`Creating: ${bsvpushDir}`);
    fs.mkdirSync(bsvpushDir);
  }

  const metanet = path.join(bsvpushDir, 'metanet.json');
  if (!fs.existsSync(metanet)) {
    console.log(`Creating: ${metanet}`);
    const masterKey = bsv.HDPrivateKey();
    const json = {
      masterKey: masterKey.xprivkey,
      root: {
        keyPath: 'm/0',
        index: 0,
        children: {}
      }
    };
    fs.writeFileSync(metanet, JSON.stringify(json, null, 2));
  }

  const bsvpush = path.join(process.cwd(), 'bsvpush.json');
  if (!fs.existsSync(bsvpush)) {
    console.log(`Creating: ${bsvpush}`);
    const json = {
      name: "",
      owner: "",
      description: "",
      sponsor: { to: "" },
      version: "",
      hidden: false
    };
    fs.writeFileSync(bsvpush, JSON.stringify(json, null, 2));
  }

  const bsvpushHomeDir = path.join(process.env.HOME, '.bsvpush');
  if (!fs.existsSync(bsvpushHomeDir)) {
    console.log(`Creating: ${bsvpushHomeDir}`);
    fs.mkdirSync(bsvpushHomeDir);
  }

  const fundingKey = path.join(bsvpushHomeDir, 'funding_key');
  if (!fs.existsSync(fundingKey)) {
    console.log(`Creating: ${fundingKey}`);
    const json = {
      xprv: '',
      derivationPath: 'm/0/0'
    };
    fs.writeFileSync(fundingKey, JSON.stringify(json, null, 2));
  }

  // Add .bsvpush directory to .gitignore
  // This is a safety measure as .bsvpush contains the master private key
  console.log(`Adding .bsvpush to .gitignore`);
  const gitIgnore = path.join(process.cwd(), '.gitignore');
  if (!fs.existsSync(gitIgnore)) {
    fs.writeFileSync(gitIgnore, ".bsvpush");
  } else {
    fs.appendFileSync(gitIgnore, "\n.bsvpush");
  }


}

