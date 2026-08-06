import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatAbsoluteDate, formatRelativeDate } from './dateUtils';

describe('formatRelativeDate', () => {
  beforeEach(() => {
    // A fixed "now" so the expected output can't drift as real time passes.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks the largest unit that fits', () => {
    expect(formatRelativeDate('2026-07-01T09:00:00Z')).toBe('3 hours ago');
    expect(formatRelativeDate('2026-04-01T12:00:00Z')).toBe('3 months ago');
    expect(formatRelativeDate('2024-07-01T12:00:00Z')).toBe('2 years ago');
  });

  it('uses words where English has them', () => {
    expect(formatRelativeDate('2026-06-30T12:00:00Z')).toBe('yesterday');
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatRelativeDate('not a date')).toBe('');
  });
});

describe('formatAbsoluteDate', () => {
  it('formats as a short month, day, and year', () => {
    expect(formatAbsoluteDate('2026-04-26T02:45:25Z')).toBe('Apr 26, 2026');
  });

  /**
   * The regression this exists for: these timestamps are UTC, and rendering them
   * in a western-hemisphere local zone pushes an early-morning UTC time back onto
   * the previous day. This suite runs under TZ=America/Denver (set in the Vitest
   * config), so a naive implementation would say "Mar 27" here and fail.
   */
  it('renders in UTC so early-morning dates do not slip a day', () => {
    expect(formatAbsoluteDate('2015-03-28T03:41:00Z')).toBe('Mar 28, 2015');
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatAbsoluteDate('')).toBe('');
  });
});
