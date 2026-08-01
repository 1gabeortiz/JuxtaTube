/**
 * Server-side environment access.
 *
 * Anything read here runs only inside a Vercel Function, never in the browser.
 * Vite refuses to bundle non-VITE_ variables into client code, so a mistake
 * that tried to read these from a component would fail loudly rather than
 * silently shipping a secret to users.
 */

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = 'MissingEnvError';
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new MissingEnvError(name);
  }
  return value;
}
