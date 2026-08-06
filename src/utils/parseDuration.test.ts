import { describe, expect, it } from 'vitest';
import { durationToSeconds, parseDuration } from './parseDuration';

describe('durationToSeconds', () => {
  it('reads each ISO 8601 component', () => {
    expect(durationToSeconds('PT13S')).toBe(13);
    expect(durationToSeconds('PT4M13S')).toBe(253);
    expect(durationToSeconds('PT1H2M3S')).toBe(3_723);
    expect(durationToSeconds('P1DT2H')).toBe(93_600);
  });

  it('treats unparseable input as zero instead of throwing', () => {
    expect(durationToSeconds('banana')).toBe(0);
    expect(durationToSeconds('')).toBe(0);
  });
});

describe('parseDuration', () => {
  it('formats short videos as m:ss', () => {
    expect(parseDuration('PT4M13S')).toBe('4:13');
    expect(parseDuration('PT59S')).toBe('0:59');
  });

  it('adds an hours field and zero-pads minutes past the hour', () => {
    expect(parseDuration('PT1H2M3S')).toBe('1:02:03');
    expect(parseDuration('PT1H')).toBe('1:00:00');
  });

  // Livestream archives are the realistic case for a duration over a day.
  it('rolls days up into the hours field', () => {
    expect(parseDuration('P1DT2H')).toBe('26:00:00');
  });

  it('falls back to 0:00 for zero or unparseable durations', () => {
    expect(parseDuration('PT0S')).toBe('0:00');
    expect(parseDuration('nonsense')).toBe('0:00');
  });
});
