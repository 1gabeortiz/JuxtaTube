import { useState } from 'react';
import { useOwnerMode } from '../../hooks/useOwnerMode';
import { UnlockForm } from './UnlockForm';

/**
 * Header control for entering and leaving owner mode.
 *
 * Public visitors can ignore it entirely: everything reachable without it still
 * works, so this reads as an owner's control rather than a login wall.
 */
export function OwnerModeButton() {
  const { isUnlocked, lock } = useOwnerMode();
  const [open, setOpen] = useState(false);

  if (isUnlocked) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-positive">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-positive" />
          Owner mode
        </span>
        <button
          type="button"
          onClick={lock}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
        >
          Lock
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        {open ? 'Cancel' : 'Unlock'}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-line bg-surface p-4 shadow-lg">
          <p className="mb-3 text-xs text-muted">
            Owner mode reveals private analytics and enables changes. Everything
            else on this site is public.
          </p>
          <UnlockForm autoFocus onUnlocked={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
