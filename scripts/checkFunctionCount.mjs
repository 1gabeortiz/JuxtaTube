/**
 * Fails the build if this project would exceed Vercel's serverless function
 * limit.
 *
 * Vercel compiles every file under api/ into its own serverless function, and
 * the Hobby plan accepts at most 12 per deployment. Exceeding it is a
 * particularly nasty failure to diagnose: the limit is enforced when the
 * deployment is uploaded, *after* the build succeeds, so typecheck, tests, and
 * `vite build` all stay green and the only symptom is "Deployment has failed"
 * with no detail in the build log.
 *
 * Files inside a directory whose name starts with an underscore are shared
 * modules, not routes, and Vercel excludes them — which is why api/_lib holds
 * the helpers and their tests.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const API_DIR = 'api';
const HOBBY_LIMIT = 12;

/** Mirrors Vercel's rule: anything not under an underscore-prefixed path. */
function findFunctionFiles(dir, prefix = '') {
  const found = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;

    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      found.push(...findFunctionFiles(join(dir, entry.name), relativePath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      found.push(relativePath);
    }
  }

  return found;
}

const files = findFunctionFiles(API_DIR).sort();
const headroom = HOBBY_LIMIT - files.length;

console.log(`Serverless functions: ${files.length} / ${HOBBY_LIMIT}`);
for (const file of files) console.log(`  api/${file}`);

if (files.length > HOBBY_LIMIT) {
  console.error(
    `\nThis would fail to deploy: ${files.length} functions exceeds the limit of ${HOBBY_LIMIT}.\n` +
      'Fold the new route into an existing one, or move shared code into an\n' +
      'underscore-prefixed directory like api/_lib, which does not count.',
  );
  process.exit(1);
}

if (headroom === 0) {
  console.log('\nAt the limit. Adding any new route will break deployment.');
} else {
  console.log(`\nHeadroom: ${headroom}.`);
}
