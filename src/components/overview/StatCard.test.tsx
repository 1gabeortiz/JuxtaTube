import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('shows the label and a compact value', () => {
    render(<StatCard label="Subscribers" value={10_800} />);

    expect(screen.getByText('Subscribers')).toBeInTheDocument();
    expect(screen.getByText('10.8K')).toBeInTheDocument();
  });

  // The compact form loses precision on purpose, so the exact number has to stay
  // reachable somewhere — here, as a native tooltip on hover.
  it('keeps the exact number in a title attribute', () => {
    render(<StatCard label="Views" value={2_484_720} />);

    expect(screen.getByText('2.5M')).toHaveAttribute('title', '2,484,720');
  });

  it('lets a caller override the formatting for values carrying a unit', () => {
    render(
      <StatCard label="Watch time" value={11_836} display="197 hrs" />,
    );

    expect(screen.getByText('197 hrs')).toBeInTheDocument();
    expect(screen.queryByText('11.8K')).not.toBeInTheDocument();
  });

  it('renders a hint only when one is given', () => {
    const { rerender } = render(
      <StatCard label="Net subscribers" value={12} hint="18 gained, 6 lost" />,
    );
    expect(screen.getByText('18 gained, 6 lost')).toBeInTheDocument();

    rerender(<StatCard label="Net subscribers" value={12} />);
    expect(screen.queryByText('18 gained, 6 lost')).not.toBeInTheDocument();
  });
});
