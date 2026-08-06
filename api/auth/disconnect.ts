import { revokeToken } from '../_lib/googleOAuth.js';
import { requireOwner } from '../_lib/requireOwner.js';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond.js';
import { deleteTokenRow, getTokenRow } from '../_lib/supabase.js';

/**
 * Disconnects the channel: tells Google to invalidate the grant, then deletes
 * the stored row.
 *
 * Revoking first matters. If we deleted the row and the revoke call failed, the
 * refresh token would stay valid on Google's side with no record of it here —
 * a live credential we could no longer revoke.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      requireOwner(request);

      const row = await getTokenRow();
      if (row) {
        await revokeToken(row.refresh_token);
      }

      await deleteTokenRow();

      return jsonNoStore({ connected: false });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
