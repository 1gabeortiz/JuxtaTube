/**
 * Local diagnostic: does the OWNER_ACCESS_KEY in a given env file unlock the
 * live /api/auth/status endpoint? Prints only yes/no and lengths — never the key.
 *
 * Usage: node scripts/checkOwnerKey.mjs [.env.file]
 */

import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? '.env.local';
const text = readFileSync(file, 'utf8');
const match = /^OWNER_ACCESS_KEY=(.*)$/m.exec(text);

if (!match) {
  console.error(`No OWNER_ACCESS_KEY in ${file}`);
  process.exit(1);
}

let key = match[1].trim();
if (
  (key.startsWith('"') && key.endsWith('"')) ||
  (key.startsWith("'") && key.endsWith("'"))
) {
  key = key.slice(1, -1);
}

const base = process.argv[3] ?? 'https://juxtatube.vercel.app';

async function tryOnce(label, init) {
  const response = await fetch(`${base}/api/auth/status`, init);
  const body = await response.json();
  console.log(
    `${label}: HTTP ${response.status} owner=${body.owner} connected=${body.connected}`,
  );
}

console.log(`file=${file} keyLength=${key.length} base=${base}`);

await tryOnce('no key', {});
await tryOnce('x-owner-key header', {
  headers: { 'x-owner-key': key },
});
await tryOnce('Authorization Bearer', {
  headers: { Authorization: `Bearer ${key}` },
});
await tryOnce('JSON body POST', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ownerKey: key }),
});
