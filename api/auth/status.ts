import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond';
import { getConnectionRow } from '../_lib/supabase';

/** Reports whether the owner's channel is connected. Never returns a token. */
export default async function handler(request: Request): Promise<Response> {
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
}
