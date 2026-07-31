import { NavLink } from 'react-router';

const LINKS = [
  // `end` stops the "/" link from matching every route, since every path starts with "/"
  { to: '/', label: 'Overview', end: true },
  { to: '/analytics', label: 'Analytics', end: false },
  { to: '/content-tools', label: 'Content Tools', end: false },
  { to: '/competitors', label: 'Competitors', end: false },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:bg-surface hover:text-ink',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
