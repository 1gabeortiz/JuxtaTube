import { describe, expect, it } from 'vitest';
import { formatWatchTime, minutesToHours } from './formatWatchTime';

describe('formatWatchTime', () => {
  it('stays in minutes below an hour', () => {
    expect(formatWatchTime(45)).toBe('45 min');
    expect(formatWatchTime(59.4)).toBe('59 min');
  });

  it('switches to one decimal place of hours', () => {
    expect(formatWatchTime(90)).toBe('1.5 hrs');
    expect(formatWatchTime(60)).toBe('1 hr');
  });

  it('rounds to whole hours past ten, with thousands grouped', () => {
    expect(formatWatchTime(11_836)).toBe('197 hrs');
    expect(formatWatchTime(600_000)).toBe('10,000 hrs');
  });

  it('shows zero rather than a negative or NaN', () => {
    expect(formatWatchTime(0)).toBe('0 min');
    expect(formatWatchTime(-30)).toBe('0 min');
    expect(formatWatchTime(Number.NaN)).toBe('0 min');
  });
});

describe('minutesToHours', () => {
  it('converts to hours at one decimal of precision for charting', () => {
    expect(minutesToHours(11_836)).toBe(197.3);
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(0)).toBe(0);
  });
});
