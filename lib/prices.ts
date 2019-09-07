import * as http from 'superagent';

export async function convertSatoshis(satoshis: number, currency:string): Promise<number> {

  let bsv = satoshis / 100000000;

  let resp = await http.get(`https://api.anypay.global/convert/${bsv}-BSV/to-${currency}`)

  return resp.body.conversion.output.value;

}

