/**
 * Thin wrapper around Google Identity Services (GIS).
 *
 * GIS is loaded from Google's CDN at runtime rather than bundled, because
 * Google requires the live script — a vendored copy is unsupported and would go
 * stale against their servers.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client';

/**
 * What we ask permission for. Both are read-only, and Google shows the user
 * exactly this list on the consent screen.
 *
 * - yt-analytics.readonly — views, watch time, retention
 * - youtube.readonly      — channel and video metadata as the owner
 */
const SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

interface CodeResponse {
  code?: string;
  error?: string;
}

interface CodeClient {
  requestCode(): void;
}

interface CodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode: 'popup' | 'redirect';
  callback: (response: CodeResponse) => void;
  error_callback?: (error: { type?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient(config: CodeClientConfig): CodeClient;
        };
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Clear the cache so a later retry can attempt the load again instead of
      // resolving against a permanently rejected promise.
      loadPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Opens Google's consent popup and resolves with a one-time authorization code.
 *
 * The code is useless on its own — it only becomes tokens when combined with
 * the client secret, which lives on the server. That is why it is safe for this
 * step to happen in the browser.
 */
export async function requestAuthCode(clientId: string): Promise<string> {
  await loadGoogleIdentity();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google sign-in is unavailable.');
  }

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initCodeClient({
      client_id: clientId,
      scope: SCOPES,
      ux_mode: 'popup',
      callback: (response) => {
        if (!response.code) {
          reject(new Error('Authorization was not completed.'));
          return;
        }
        resolve(response.code);
      },
      error_callback: () => {
        reject(new Error('Authorization was cancelled.'));
      },
    });

    client.requestCode();
  });
}
