import { describe, expect, it } from 'vitest';
import { formatExact, formatNumber } from './formatNumber';

describe('formatNumber', () => {
  it('leaves values under a thousand as plain integers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(999)).toBe('999');
  });

  it('keeps one decimal while the scaled value is under 100', () => {
    expect(formatNumber(10_800)).toBe('10.8K');
    expect(formatNumber(2_484_720)).toBe('2.5M');
    expect(formatNumber(2_500_000_000)).toBe('2.5B');
  });

  // The bug this guards against: rounding 10,800 subscribers to "11K" overstates
  // the count by 200 in a number the channel owner knows by heart.
  it('drops the decimal only once the scaled value reaches 100', () => {
    expect(formatNumber(99_900)).toBe('99.9K');
    expect(formatNumber(123_400)).toBe('123K');
  });

  it('omits a pointless trailing zero', () => {
    expect(formatNumber(1_000)).toBe('1K');
    expect(formatNumber(3_000_000)).toBe('3M');
  });

  it('formats negatives the same way, for net-subscriber losses', () => {
    expect(formatNumber(-10_800)).toBe('-10.8K');
    expect(formatNumber(-42)).toBe('-42');
  });

  it('returns a dash rather than "NaN" for unusable input', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatExact', () => {
  it('groups thousands for tooltip display', () => {
    expect(formatExact(2_484_720)).toBe('2,484,720');
    expect(formatExact(999)).toBe('999');
  });

  it('returns a dash for unusable input', () => {
    expect(formatExact(Number.NaN)).toBe('—');
  });
});
