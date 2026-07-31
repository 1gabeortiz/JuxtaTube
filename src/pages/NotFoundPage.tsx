import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="py-20 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">
        Back to Overview
      </Link>
    </section>
  );
}
