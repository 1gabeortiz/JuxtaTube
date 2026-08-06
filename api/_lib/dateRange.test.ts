import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDays, resolveDateRange } from './dateRange.js';

describe('parseDays', () => {
  it('defaults to 28 days when the parameter is absent', () => {
    expect(parseDays(null)).toBe(28);
  });

  it('accepts the ranges the UI offers', () => {
    expect(parseDays('28')).toBe(28);
    expect(parseDays('90')).toBe(90);
    expect(parseDays('365')).toBe(365);
  });

  // This value arrives straight from a query string, so it is attacker-controlled
  // and has to be treated as arbitrary text rather than a number.
  it('falls back to the default for anything that is not a positive integer', () => {
    expect(parseDays('abc')).toBe(28);
    expect(parseDays('0')).toBe(28);
    expect(parseDays('-5')).toBe(28);
    expect(parseDays('1.5')).toBe(28);
    expect(parseDays('')).toBe(28);
  });

  it('clamps oversized requests instead of rejecting them', () => {
    expect(parseDays('100000')).toBe(365);
  });
});

describe('resolveDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // YouTube finalizes analytics a couple of days late. Asking for today would
  // return zeros and draw a chart that looks like the channel died.
  it('ends two days back to stay clear of unfinalized data', () => {
    expect(resolveDateRange(28).endDate).toBe('2026-06-29');
  });

  it('spans the requested number of days inclusively', () => {
    const range = resolveDateRange(28);

    expect(range.startDate).toBe('2026-06-02');
    expect(range.days).toBe(28);

    const spanMs = Date.parse(range.endDate) - Date.parse(range.startDate);
    expect(spanMs / 86_400_000).toBe(27);
  });

  it('crosses month and year boundaries correctly', () => {
    const range = resolveDateRange(365);

    expect(range.startDate).toBe('2025-06-30');
    expect(range.endDate).toBe('2026-06-29');
  });
});
