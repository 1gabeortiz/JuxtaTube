import { useId, useState } from 'react';
import { useOwnerMode } from '../../hooks/useOwnerMode';

interface UnlockFormProps {
  /** Lets a parent close its popover once the key is accepted. */
  onUnlocked?: () => void;
  autoFocus?: boolean;
}

export function UnlockForm({ onUnlocked, autoFocus }: UnlockFormProps) {
  const { unlock } = useOwnerMode();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'rejected'>('idle');
  const inputId = useId();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const candidate = value.trim();
    if (candidate === '') return;

    setState('checking');
    const accepted = await unlock(candidate);

    if (accepted) {
      setValue('');
      setState('idle');
      onUnlocked?.();
    } else {
      setState('rejected');
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label htmlFor={inputId} className="sr-only">
        Owner key
      </label>

      <div className="flex gap-2">
        <input
          id={inputId}
          // type=password keeps it out of shoulder-surfing range and stops
          // browsers from offering it as an autofill suggestion later.
          type="password"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            if (state === 'rejected') setState('idle');
          }}
          placeholder="Owner key"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={value.trim() === '' || state === 'checking'}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </div>

      {state === 'rejected' ? (
        <p role="alert" className="mt-2 text-xs text-warning">
          That key was not accepted.
        </p>
      ) : null}
    </form>
  );
}
