import { Injectable } from '@nestjs/common';
import { PlacedWord, PuzzleData } from './crossword.types';

const GRID_SIZE = 21;
const CENTER = Math.floor(GRID_SIZE / 2);

type Direction = 'across' | 'down';

@Injectable()
export class CrosswordGeneratorService {
  /**
   * Given a list of words and a map of word → clue, attempts to place as many
   * words as possible onto a crossword grid by finding shared letters.
   * Returns the trimmed grid and the list of placed words with their clue numbers.
   */
  generate(words: string[], clueMap: Map<string, string>): PuzzleData {
    const sorted = [...new Set(words)]
      .filter((w) => w.length > 1)
      .sort((a, b) => b.length - a.length)
      .slice(0, 15);

    if (sorted.length === 0) return { grid: [], words: [] };

    const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(null),
    );

    const placed: Omit<PlacedWord, 'number'>[] = [];

    // Place the first (longest) word horizontally through the center
    const first = sorted[0];
    const firstCol = CENTER - Math.floor(first.length / 2);
    this.placeWord(grid, first, CENTER, firstCol, 'across');
    placed.push({
      word: first,
      row: CENTER,
      col: firstCol,
      direction: 'across',
      clue: clueMap.get(first) ?? first,
    });

    for (const word of sorted.slice(1)) {
      const placement = this.findBestPlacement(grid, word, placed);
      if (!placement) continue;
      const { row, col, direction } = placement;
      this.placeWord(grid, word, row, col, direction);
      placed.push({
        word,
        row,
        col,
        direction,
        clue: clueMap.get(word) ?? word,
      });
    }

    return this.trimAndNumber(grid, placed);
  }

  private placeWord(
    grid: (string | null)[][],
    word: string,
    row: number,
    col: number,
    direction: Direction,
  ): void {
    for (let i = 0; i < word.length; i++) {
      if (direction === 'across') {
        grid[row][col + i] = word[i].toUpperCase();
      } else {
        grid[row + i][col] = word[i].toUpperCase();
      }
    }
  }

  private findBestPlacement(
    grid: (string | null)[][],
    word: string,
    placed: Omit<PlacedWord, 'number'>[],
  ): { row: number; col: number; direction: Direction } | null {
    let best: {
      row: number;
      col: number;
      direction: Direction;
      score: number;
    } | null = null;

    for (const existing of placed) {
      for (let wi = 0; wi < word.length; wi++) {
        for (let ei = 0; ei < existing.word.length; ei++) {
          if (word[wi].toLowerCase() !== existing.word[ei].toLowerCase())
            continue;

          const newDirection: Direction =
            existing.direction === 'across' ? 'down' : 'across';
          let newRow: number;
          let newCol: number;

          if (existing.direction === 'across') {
            newRow = existing.row - wi;
            newCol = existing.col + ei;
          } else {
            newRow = existing.row + ei;
            newCol = existing.col - wi;
          }

          if (!this.canPlace(grid, word, newRow, newCol, newDirection))
            continue;

          const score = this.scoreOverlap(
            grid,
            word,
            newRow,
            newCol,
            newDirection,
          );
          if (best === null || score > best.score) {
            best = { row: newRow, col: newCol, direction: newDirection, score };
          }
        }
      }
    }

    return best
      ? { row: best.row, col: best.col, direction: best.direction }
      : null;
  }

  private canPlace(
    grid: (string | null)[][],
    word: string,
    row: number,
    col: number,
    direction: Direction,
  ): boolean {
    const len = word.length;

    if (direction === 'across') {
      if (row < 0 || row >= GRID_SIZE || col < 0 || col + len > GRID_SIZE)
        return false;
      if (col > 0 && grid[row][col - 1] !== null) return false;
      if (col + len < GRID_SIZE && grid[row][col + len] !== null) return false;

      let hasIntersection = false;
      for (let i = 0; i < len; i++) {
        const cell = grid[row][col + i];
        if (cell !== null) {
          if (cell !== word[i].toUpperCase()) return false;
          hasIntersection = true;
        } else {
          if (row > 0 && grid[row - 1][col + i] !== null) return false;
          if (row < GRID_SIZE - 1 && grid[row + 1][col + i] !== null)
            return false;
        }
      }
      return hasIntersection;
    } else {
      if (col < 0 || col >= GRID_SIZE || row < 0 || row + len > GRID_SIZE)
        return false;
      if (row > 0 && grid[row - 1][col] !== null) return false;
      if (row + len < GRID_SIZE && grid[row + len][col] !== null) return false;

      let hasIntersection = false;
      for (let i = 0; i < len; i++) {
        const cell = grid[row + i][col];
        if (cell !== null) {
          if (cell !== word[i].toUpperCase()) return false;
          hasIntersection = true;
        } else {
          if (col > 0 && grid[row + i][col - 1] !== null) return false;
          if (col < GRID_SIZE - 1 && grid[row + i][col + 1] !== null)
            return false;
        }
      }
      return hasIntersection;
    }
  }

  /** Count how many cells of the proposed placement already have a matching letter. */
  private scoreOverlap(
    grid: (string | null)[][],
    word: string,
    row: number,
    col: number,
    direction: Direction,
  ): number {
    let score = 0;
    for (let i = 0; i < word.length; i++) {
      const cell =
        direction === 'across' ? grid[row][col + i] : grid[row + i][col];
      if (cell !== null) score++;
    }
    return score;
  }

  /**
   * Trim the grid to the bounding box of placed letters (+ 1 cell padding),
   * then renumber words top-to-bottom, left-to-right — matching standard
   * crossword numbering rules.
   */
  private trimAndNumber(
    grid: (string | null)[][],
    placed: Omit<PlacedWord, 'number'>[],
  ): PuzzleData {
    let minRow = GRID_SIZE,
      maxRow = 0,
      minCol = GRID_SIZE,
      maxCol = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== null) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }

    minRow = Math.max(0, minRow - 1);
    maxRow = Math.min(GRID_SIZE - 1, maxRow + 1);
    minCol = Math.max(0, minCol - 1);
    maxCol = Math.min(GRID_SIZE - 1, maxCol + 1);

    const trimmedGrid = grid
      .slice(minRow, maxRow + 1)
      .map((row) => row.slice(minCol, maxCol + 1));

    const adjusted = placed.map((w) => ({
      ...w,
      row: w.row - minRow,
      col: w.col - minCol,
    }));

    // Assign numbers top-to-bottom, left-to-right
    const cellNumbers = new Map<string, number>();
    let num = 1;
    const rows = trimmedGrid.length;
    const cols = trimmedGrid[0]?.length ?? 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (trimmedGrid[r][c] === null) continue;
        const startsAcross = adjusted.some(
          (w) => w.direction === 'across' && w.row === r && w.col === c,
        );
        const startsDown = adjusted.some(
          (w) => w.direction === 'down' && w.row === r && w.col === c,
        );
        if (startsAcross || startsDown) {
          cellNumbers.set(`${r},${c}`, num++);
        }
      }
    }

    const words: PlacedWord[] = adjusted.map((w) => ({
      ...w,
      number: cellNumbers.get(`${w.row},${w.col}`) ?? 0,
    }));

    return { grid: trimmedGrid, words };
  }
}
