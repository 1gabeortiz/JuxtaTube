import { useAuthStatus, useConnectChannel, useDisconnectChannel } from '../../hooks/useAuth';
import { useOwnerMode } from '../../hooks/useOwnerMode';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/**
 * Connect / disconnect control for the owner's Google authorization.
 *
 * Rendered in the header so the connection state is visible from every page,
 * since a missing connection is the reason private data would fail to load.
 */
export function ConnectChannelButton() {
  const status = useAuthStatus();
  const { isUnlocked } = useOwnerMode();
  const connect = useConnectChannel();
  const disconnect = useDisconnectChannel();

  if (status.isPending) {
    return <div className="h-9 w-32 animate-pulse rounded-lg bg-surface" />;
  }

  /**
   * Connecting and disconnecting both rewrite the single stored token row, so
   * both routes require the owner key. A visitor gets the state as read-only
   * rather than a button that would walk them through Google's consent screen
   * only to fail at the final step.
   */
  if (!isUnlocked) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            status.data?.connected ? 'bg-positive' : 'bg-line'
          }`}
        />
        {status.data?.connected ? 'Channel connected' : 'No channel connected'}
      </span>
    );
  }

  const actionError = connect.error ?? disconnect.error;

  if (status.data?.connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-muted">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-positive"
          />
          Connected
        </span>
        <button
          type="button"
          onClick={() => disconnect.mutate()}
          disabled={disconnect.isPending}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-muted hover:text-ink disabled:opacity-50"
        >
          {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => connect.mutate()}
        disabled={connect.isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {connect.isPending ? 'Waiting for Google…' : 'Connect channel'}
      </button>

      {actionError ? (
        <p className="max-w-60 text-right text-xs text-warning">
          {errorMessage(actionError)}
        </p>
      ) : null}
    </div>
  );
}
