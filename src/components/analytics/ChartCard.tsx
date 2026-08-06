import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared panel around every chart, so spacing and headings stay consistent. */
export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="animate-rise rounded-xl border border-line bg-surface p-5">
      <header className="mb-4">
        <h2 className="text-lg">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

/** Shown in place of a chart when a range genuinely has no data. */
export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted">
      {message}
    </div>
  );
}
