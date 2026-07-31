import { Link } from 'react-router';
import { Nav } from './Nav';

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          Juxta<span className="text-accent">Tube</span>
        </Link>
        <Nav />
      </div>
    </header>
  );
}
