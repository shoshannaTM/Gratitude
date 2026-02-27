import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { Payload } from '../auth/dto/payload.dto';
import { GratitudeService } from './gratitude.service';
import { CreateGratitudeDto } from './dto/create-gratitude.dto';

@Controller('gratitude')
@UseGuards(AuthGuard)
export class GratitudeController {
  constructor(private readonly gratitudeService: GratitudeService) {}

  /** POST /gratitude — submit today's gratitudes (JSON API). */
  @Post()
  async createEntry(@User() user: Payload, @Body() body: CreateGratitudeDto) {
    return this.gratitudeService.createEntry(user.userId, body);
  }

  /** POST /gratitude/submit — HTML form submission, redirects to / on success. */
  @Post('submit')
  async submitForm(
    @User() user: Payload,
    @Body() body: { entries: string | string[]; entryDate?: string },
    @Res() res: Response,
  ) {
    const raw = Array.isArray(body.entries) ? body.entries : [body.entries];
    const entries = raw.map((e) => e?.trim()).filter(Boolean);
    const entryDate = body.entryDate ?? new Date().toISOString().split('T')[0];

    await this.gratitudeService.createEntry(user.userId, {
      entries,
      entryDate,
    });

    return res.redirect('/');
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
