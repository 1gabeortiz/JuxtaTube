import { requireOwner } from '../_lib/requireOwner.js';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond.js';

/**
 * Checks an owner key and nothing else.
 *
 * Exists so the unlock form can tell the user "that key is wrong" immediately,
 * instead of storing a bad key and leaving them to guess why every panel still
 * says locked. Deliberately touches no external API, so a wrong guess costs no
 * quota and no database round trip.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      requireOwner(request);
      return jsonNoStore({ owner: true });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
