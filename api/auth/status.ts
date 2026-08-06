import type { AuthStatus } from '../../src/api/types.js';
import { requireOwner } from '../_lib/requireOwner.js';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond.js';
import { getConnectionRow } from '../_lib/supabase.js';

/**
 * Reports whether the key on this request is the owner's.
 *
 * Returns a boolean instead of throwing, because an anonymous visitor calling
 * this route is the normal case, not a failure. A wrong or absent key simply
 * means false. A missing OWNER_ACCESS_KEY on the server also lands here as
 * false, which is the safe direction.
 */
function isOwner(request: Request): boolean {
  try {
    requireOwner(request);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reports connection and owner state. Never returns a token.
 *
 * The owner check is folded into this route rather than given its own endpoint
 * because Vercel's Hobby plan allows 12 serverless functions per deployment and
 * every file under api/ consumes one. This route already existed and already
 * answers "what is this session allowed to see", so the check belongs here.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const connection = await getConnectionRow();

      const payload: AuthStatus = {
        connected: connection !== null,
        connectedAt: connection?.updated_at ?? null,
        owner: isOwner(request),
      };

      return jsonNoStore(payload);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
