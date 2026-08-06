import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TagCopyBox } from './TagCopyBox';

describe('TagCopyBox', () => {
  it('reports the tag count and character budget', () => {
    render(<TagCopyBox tags={['lofi', 'beats']} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10/500')).toBeInTheDocument();
  });

  it('exposes the paste-ready string in an editable-looking field', () => {
    render(<TagCopyBox tags={['lofi', 'beats']} />);

    expect(
      screen.getByLabelText('Tags ready to paste into YouTube'),
    ).toHaveValue('lofi,beats');
  });

  it('copies the packed string and confirms it', async () => {
    // userEvent.setup installs a working clipboard stub in jsdom, which has no
    // real Clipboard API.
    const user = userEvent.setup();
    render(<TagCopyBox tags={['lofi', 'beats']} />);

    await user.click(screen.getByRole('button', { name: 'Copy tags' }));

    await expect(navigator.clipboard.readText()).resolves.toBe('lofi,beats');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  /**
   * The Clipboard API needs a secure context, so on plain HTTP the copy throws.
   * The component has to say so, because the button would otherwise appear to do
   * nothing at all.
   */
  it('explains the manual fallback when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('blocked'),
    );

    render(<TagCopyBox tags={['lofi']} />);
    await user.click(screen.getByRole('button', { name: 'Copy tags' }));

    expect(await screen.findByText(/Clipboard access was blocked/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy tags' })).toBeInTheDocument();
  });

  it('reports how many tags had to be left out', () => {
    const many = Array.from({ length: 100 }, (_, index) => `tag-number-${index}`);
    render(<TagCopyBox tags={many} />);

    expect(screen.getByText(/didn't fit/)).toBeInTheDocument();
  });

  it('renders nothing when there are no tags to copy', () => {
    const { container } = render(<TagCopyBox tags={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
