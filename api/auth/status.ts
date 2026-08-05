import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond.js';
import { getConnectionRow } from '../_lib/supabase.js';

/** Reports whether the owner's channel is connected. Never returns a token. */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const connection = await getConnectionRow();

      return jsonNoStore({
        connected: connection !== null,
        connectedAt: connection?.updated_at ?? null,
      });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
