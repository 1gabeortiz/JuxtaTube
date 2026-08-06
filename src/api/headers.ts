/**
 * Header names shared by the frontend and the API routes.
 *
 * Kept in its own module, with no imports, so the server can read it too. The
 * browser-side key store touches sessionStorage, which does not exist in Node,
 * so the constant cannot live there.
 */

export const OWNER_KEY_HEADER = 'x-owner-key';
