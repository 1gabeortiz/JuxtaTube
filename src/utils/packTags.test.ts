import { describe, expect, it } from 'vitest';
import { YOUTUBE_TAG_LIMIT, packTags } from './packTags';

describe('packTags', () => {
  it('joins with bare commas, since YouTube trims whitespace anyway', () => {
    const packed = packTags(['lofi', 'beats']);

    expect(packed.text).toBe('lofi,beats');
    expect(packed.tags).toEqual(['lofi', 'beats']);
    expect(packed.characterCount).toBe(10);
    expect(packed.omitted).toBe(0);
  });

  // The important behavior: a tag that doesn't fit is skipped, not treated as a
  // stopping point. Ending the loop early would waste the remaining budget on
  // one long tag when several short ones were still available.
  it('keeps scanning past a tag that does not fit', () => {
    const packed = packTags(['xxxxxxxxxxxx', 'ab'], 10);

    expect(packed.tags).toEqual(['ab']);
    expect(packed.omitted).toBe(1);
  });

  it('never exceeds the character budget', () => {
    const many = Array.from({ length: 200 }, (_, index) => `tag-number-${index}`);
    const packed = packTags(many);

    expect(packed.characterCount).toBeLessThanOrEqual(YOUTUBE_TAG_LIMIT);
    expect(packed.omitted).toBeGreaterThan(0);
    expect(packed.tags.length + packed.omitted).toBe(many.length);
  });

  it('trims surrounding whitespace and drops empty entries', () => {
    const packed = packTags([' lofi ', '   ', 'beats']);

    expect(packed.text).toBe('lofi,beats');
  });

  it('returns an empty result for an empty list', () => {
    const packed = packTags([]);

    expect(packed.tags).toEqual([]);
    expect(packed.text).toBe('');
    expect(packed.characterCount).toBe(0);
  });
});
