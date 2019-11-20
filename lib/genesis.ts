
import fetch from 'node-fetch';

export async function query(query) {
  const b64 = Buffer.from(JSON.stringify(query)).toString('base64');
  const url = "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + b64;
  const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } });
  const json = await response.json();
  return json;
}

