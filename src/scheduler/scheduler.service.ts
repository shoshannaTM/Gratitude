import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../dal/entity/user.entity';
import { NotificationService } from '../notification/notification.service';
import { GratitudeService } from '../gratitude/gratitude.service';
import { KeywordExtractorService } from './keyword-extractor.service';
import { CrosswordService } from '../crossword/crossword.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly notificationService: NotificationService,
    private readonly gratitudeService: GratitudeService,
    private readonly keywordExtractor: KeywordExtractorService,
    @Inject(forwardRef(() => CrosswordService))
    private readonly crosswordService: CrosswordService,
  ) {}

  /**
   * Runs every minute. For each user, checks whether the current time in
   * their timezone matches their chosen promptTime, and if so sends a push.
   *
   * Running per-minute and comparing times is a standard pattern when users
   * each have different scheduled times — one global cron, per-user logic inside.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async sendDailyGratitudePrompts(): Promise<void> {
    const users = await this.userRepository.findAll();

    for (const user of users) {
      if (!user.promptTime) continue;

      const localTime = this.getCurrentTimeInTimezone(user.timezone ?? 'UTC');
      if (localTime !== user.promptTime) continue;

      await this.notificationService.sendWebPushNotification(
        {
          title: 'Time for your daily gratitudes 🙏',
          body: `Record your ${user.promptCount} gratitudes for today.`,
          click_action: '/',
        },
        user.id,
      );
      this.logger.log(`Sent daily prompt to user ${user.id} at ${localTime}`);
    }
  }

  /**
   * Runs at midnight every Sunday.
   * Collects last week's gratitudes for every user, extracts the most
   * meaningful keywords, and hands them to the crossword generator.
   *
   * The crossword generation and persistence are added in step 5.
   */
  @Cron('0 0 * * 0')
  async generateWeeklyGratitudeCrosswords(): Promise<void> {
    this.logger.log('Weekly crossword generation starting...');
    const users = await this.userRepository.findAll();
    // Sunday midnight — the week that just ended started last Monday
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    for (const user of users) {
      const entries = await this.gratitudeService.getEntriesForLastWeek(
        user.id,
      );
      if (entries.length === 0) continue;

      const allTexts = entries.flatMap((e) => e.entries);
      const keywords = this.keywordExtractor.extractKeywords(allTexts);
      this.logger.log(
        `User ${user.id} — keywords for this week's crossword: ${keywords.join(', ')}`,
      );
      await this.crosswordService.generateAndSavePuzzle(
        user.id,
        weekStartDate,
        entries,
      );
      await this.notificationService.sendWebPushNotification(
        {
          title: "This week's gratitude crossword is ready! 🧩",
          body: 'Your weekly crossword puzzle has been generated.',
          click_action: '/crossword',
        },
        user.id,
      );
    }
  }

  /**
   * Returns the current "HH:MM" time in the given IANA timezone.
   * Falls back to "00:00" if the timezone string is invalid.
   */
  private getCurrentTimeInTimezone(timezone: string): string {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());

      const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
      const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  }
}
