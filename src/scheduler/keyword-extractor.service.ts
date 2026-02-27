import { Injectable } from '@nestjs/common';

/** Common English words that carry no meaning for a crossword. */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'that',
  'this',
  'it',
  'its',
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'he',
  'she',
  'they',
  'his',
  'her',
  'their',
  'very',
  'so',
  'just',
  'about',
  'up',
  'out',
  'into',
  'than',
  'then',
  'when',
  'which',
  'who',
  'how',
  'what',
  'if',
  'as',
  'not',
  'no',
  'all',
  'more',
  'also',
  'time',
  'get',
  'got',
  'am',
]);

@Injectable()
export class KeywordExtractorService {
  /**
   * Given an array of free-text strings, returns the top N most frequent
   * meaningful words — ignoring stopwords.
   * Words are lower-cased and de-duplicated by form.
   */
  extractKeywords(texts: string[], topN = 10): string[] {
    const frequency = new Map<string, number>();

    for (const text of texts) {
      const words = text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '') // strip punctuation
        .split(/\s+/)
        .filter((w) => !STOPWORDS.has(w));

      for (const word of words) {
        frequency.set(word, (frequency.get(word) ?? 0) + 1);
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1]) // highest frequency first
      .slice(0, topN)
      .map(([word]) => word);
  }
}
