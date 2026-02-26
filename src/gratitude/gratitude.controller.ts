import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { Payload } from '../auth/dto/payload.dto';
import { GratitudeService } from './gratitude.service';
import { CreateGratitudeDto } from './dto/create-gratitude.dto';

@Controller('gratitude')
@UseGuards(AuthGuard)
export class GratitudeController {
  constructor(private readonly gratitudeService: GratitudeService) {}

  /** POST /gratitude — submit today's gratitudes. */
  @Post()
  async createEntry(@User() user: Payload, @Body() body: CreateGratitudeDto) {
    return this.gratitudeService.createEntry(user.userId, body);
  }

  /**
   * GET /gratitude/today — get today's entry, or null if not yet submitted.
   * Must be declared before GET /gratitude or NestJS treats "today" as a path param.
   */
  @Get('today')
  async getTodaysEntry(@User() user: Payload) {
    return this.gratitudeService.getTodaysEntry(user.userId);
  }

  /** GET /gratitude?year=2026 — get all entries for a year (defaults to current year). */
  @Get()
  async getEntries(@User() user: Payload, @Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.gratitudeService.getEntriesForYear(user.userId, targetYear);
  }
}
