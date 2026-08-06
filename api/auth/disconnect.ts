import { revokeToken } from '../_lib/googleOAuth';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond';
import { deleteTokenRow, getTokenRow } from '../_lib/supabase';

/**
 * Disconnects the channel: tells Google to invalidate the grant, then deletes
 * the stored row.
 *
 * Revoking first matters. If we deleted the row and the revoke call failed, the
 * refresh token would stay valid on Google's side with no record of it here —
 * a live credential we could no longer revoke.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 405);
  }

  try {
    const row = await getTokenRow();
    if (row) {
      await revokeToken(row.refresh_token);
    }

    await deleteTokenRow();

    return jsonNoStore({ connected: false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
