import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CrosswordPuzzle } from '../dal/entity/crosswordPuzzle.entity';
import { GratitudeEntry } from '../dal/entity/gratitudeEntry.entity';
import { CrosswordGeneratorService } from './crossword-generator.service';
import { KeywordExtractorService } from '../scheduler/keyword-extractor.service';

@Injectable()
export class CrosswordService {
  private readonly logger = new Logger(CrosswordService.name);

  constructor(
    @InjectRepository(CrosswordPuzzle)
    private readonly puzzleRepository: EntityRepository<CrosswordPuzzle>,
    private readonly generator: CrosswordGeneratorService,
    private readonly keywordExtractor: KeywordExtractorService,
  ) {}

  /**
   * Generates a crossword from the given gratitude entries and saves it.
   * If a puzzle for this user/week already exists it is overwritten.
   */
  async generateAndSavePuzzle(
    userId: number,
    weekStartDate: string,
    entries: GratitudeEntry[],
  ): Promise<CrosswordPuzzle | null> {
    const allTexts = entries.flatMap((e) => e.entries);
    const keywords = this.keywordExtractor.extractKeywords(allTexts);

    if (keywords.length === 0) {
      this.logger.warn(
        `No keywords found for user ${userId} — skipping puzzle`,
      );
      return null;
    }

    // Build clue map: word → the first gratitude sentence containing it,
    // with the target word replaced by underscores.
    const clueMap = new Map<string, string>();
    for (const keyword of keywords) {
      for (const entry of entries) {
        const match = entry.entries.find((text) =>
          text.toLowerCase().includes(keyword.toLowerCase()),
        );
        if (match) {
          clueMap.set(
            keyword,
            match.replace(
              new RegExp(keyword, 'gi'),
              '_'.repeat(keyword.length),
            ),
          );
          break;
        }
      }
      if (!clueMap.has(keyword)) clueMap.set(keyword, keyword);
    }

    const puzzleData = this.generator.generate(keywords, clueMap);

    const em = this.puzzleRepository.getEntityManager();
    const existing = await this.puzzleRepository.findOne({
      user: userId,
      weekStartDate,
    });

    if (existing) {
      existing.grid = puzzleData.grid;
      existing.words = puzzleData.words;
      existing.keywords = keywords;
      await em.persistAndFlush(existing);
      this.logger.log(
        `Updated puzzle for user ${userId} week ${weekStartDate}`,
      );
      return existing;
    }

    const puzzle = this.puzzleRepository.create({
      weekStartDate,
      grid: puzzleData.grid,
      words: puzzleData.words,
      keywords,
      createdAt: new Date(),
      user: userId,
    });
    await em.persistAndFlush(puzzle);
    this.logger.log(`Created puzzle for user ${userId} week ${weekStartDate}`);
    return puzzle;
  }

  /** Most recent puzzle for the user. */
  async getLatestPuzzle(userId: number): Promise<CrosswordPuzzle | null> {
    return this.puzzleRepository.findOne(
      { user: userId },
      { orderBy: { weekStartDate: 'DESC' } },
    );
  }

  /** Puzzle for a specific week. */
  async getPuzzleForWeek(
    userId: number,
    weekStartDate: string,
  ): Promise<CrosswordPuzzle | null> {
    return this.puzzleRepository.findOne({ user: userId, weekStartDate });
  }

  /** All puzzles for a user ordered newest first. */
  async getAllPuzzles(userId: number): Promise<CrosswordPuzzle[]> {
    return this.puzzleRepository.find(
      { user: userId },
      { orderBy: { weekStartDate: 'DESC' } },
    );
  }
}
