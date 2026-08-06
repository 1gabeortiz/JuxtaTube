import { timingSafeEqual } from 'node:crypto';
import { OWNER_KEY_HEADER } from '../../src/api/headers.js';
import { requireEnv } from './env.js';

/**
 * Guards the routes that must not be public.
 *
 * This app is deployed openly as a portfolio piece, which creates a conflict:
 * the Overview page is the demo and should stay reachable, but the Analytics
 * routes return private channel data, several routes write to the database, and
 * keyword search spends 101 of a 10,000-unit daily quota per call. Those need an
 * owner check; the rest do not.
 *
 * A shared key is the right size of solution here. There is exactly one
 * privileged user — the channel owner — so a full accounts system would add a
 * users table and a session layer to authenticate a single person.
 */

export class UnauthorizedError extends Error {
  constructor() {
    super('This data is private. Unlock owner mode to view it.');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Compares in constant time.
 *
 * A plain `===` returns as soon as two characters differ, so the time it takes
 * to fail leaks how much of the key was correct — enough to recover it one
 * character at a time. Length is compared first and separately because
 * timingSafeEqual throws on mismatched lengths, and a key's length is not the
 * part worth protecting.
 */
function matches(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  if (providedBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(providedBytes, expectedBytes);
}

/**
 * Throws unless the request carries the owner key.
 *
 * Fails closed: if OWNER_ACCESS_KEY is unset, requireEnv throws and the route
 * returns an error rather than treating "no key configured" as "no key needed".
 */
export function requireOwner(request: Request): void {
  const expected = requireEnv('OWNER_ACCESS_KEY');
  const provided = request.headers.get(OWNER_KEY_HEADER) ?? '';

  if (!matches(provided, expected)) {
    throw new UnauthorizedError();
  }
}
