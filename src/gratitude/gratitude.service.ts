import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { GratitudeEntry } from '../dal/entity/gratitudeEntry.entity';
import { CreateGratitudeDto } from './dto/create-gratitude.dto';

@Injectable()
export class GratitudeService {
  private readonly logger = new Logger(GratitudeService.name);

  constructor(
    @InjectRepository(GratitudeEntry)
    private readonly gratitudeRepository: EntityRepository<GratitudeEntry>,
  ) {}

  /** Save a new day's gratitude entries for a user. */
  async createEntry(
    userId: number,
    dto: CreateGratitudeDto,
  ): Promise<GratitudeEntry> {
    const entry = this.gratitudeRepository.create({
      entries: dto.entries,
      entryDate: dto.entryDate,
      createdAt: new Date(),
      user: userId,
    });
    await this.gratitudeRepository.getEntityManager().persistAndFlush(entry);
    this.logger.log(
      `Created gratitude entry for user ${userId} on ${dto.entryDate}`,
    );
    return entry;
  }

  /** Find today's entry for a user, or null if they haven't submitted yet. */
  async getTodaysEntry(userId: number): Promise<GratitudeEntry | null> {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    return this.gratitudeRepository.findOne({ user: userId, entryDate: today });
  }

  /** Fetch all entries for a user within an inclusive date range ("YYYY-MM-DD"). */
  async getEntriesForDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<GratitudeEntry[]> {
    return this.gratitudeRepository.find(
      {
        user: userId,
        entryDate: { $gte: startDate, $lte: endDate },
      },
      { orderBy: { entryDate: 'ASC' } },
    );
  }

  /**
   * Fetch all entries for a given calendar year, ordered by date.
   * Used by the yearly reflection view.
   */
  async getEntriesForYear(
    userId: number,
    year: number,
  ): Promise<GratitudeEntry[]> {
    return this.getEntriesForDateRange(
      userId,
      `${year}-01-01`,
      `${year}-12-31`,
    );
  }

  /**
   * Fetch the last 7 days of entries for a user.
   * Used by the weekly crossword generator.
   */
  async getEntriesForLastWeek(userId: number): Promise<GratitudeEntry[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // 7 days inclusive of today
    return this.getEntriesForDateRange(
      userId,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
    );
  }
}
