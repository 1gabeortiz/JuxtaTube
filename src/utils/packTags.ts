/**
 * YouTube caps a video's entire tags field at 500 characters, commas included.
 * Exceed it and Studio silently drops the overflow, so the limit has to be
 * respected while building the string rather than checked afterwards.
 */
export const YOUTUBE_TAG_LIMIT = 500;

/**
 * No space after the comma, deliberately. Studio trims whitespace around each
 * tag, so a space buys nothing but costs one of the 500 characters per tag —
 * which is one or two extra usable tags across a full list.
 */
const SEPARATOR = ',';

export interface PackedTags {
  /** Tags that fit, in the order given. */
  tags: string[];
  /** The exact string to paste into YouTube. */
  text: string;
  characterCount: number;
  /** How many were left out for lack of room. */
  omitted: number;
}

/**
 * Greedily fills the character budget from a ranked list.
 *
 * A tag too long to fit is skipped rather than ending the loop, because a
 * shorter tag further down the ranking may still fit — stopping at the first
 * failure would waste the remaining budget.
 */
export function packTags(tags: string[], limit = YOUTUBE_TAG_LIMIT): PackedTags {
  const chosen: string[] = [];
  let text = '';
  let omitted = 0;

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed === '') continue;

    const candidate = text === '' ? trimmed : `${text}${SEPARATOR}${trimmed}`;

    if (candidate.length <= limit) {
      chosen.push(trimmed);
      text = candidate;
    } else {
      omitted += 1;
    }
  }

  return { tags: chosen, text, characterCount: text.length, omitted };
}
