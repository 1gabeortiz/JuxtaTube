import { UnlockForm } from '../auth/UnlockForm';

interface LockedNoticeProps {
  /** What specifically is hidden, e.g. "This channel's analytics". */
  what: string;
  /** Why it is gated, when the reason is cost rather than privacy. */
  reason?: string;
}

/**
 * Stands in for owner-only content.
 *
 * Explains the gate rather than showing a bare error, because for a visitor this
 * is expected behavior, not a failure — and for the owner it needs to offer the
 * way in.
 */
export function LockedNotice({ what, reason }: LockedNoticeProps) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/50 p-8 text-center">
      <p className="font-display text-lg">{what} is private</p>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {reason ??
          'YouTube shares this data only with the channel owner, so this app keeps it behind an owner key.'}
      </p>

      <div className="mx-auto mt-5 max-w-sm">
        <UnlockForm />
      </div>
    </div>
  );
}
