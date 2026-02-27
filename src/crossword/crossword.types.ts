export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
  /** The gratitude sentence that contained this word, with the word blanked. */
  clue: string;
}

export interface PuzzleData {
  grid: (string | null)[][];
  words: PlacedWord[];
}
