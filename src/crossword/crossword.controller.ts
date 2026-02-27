import { Controller, Get, Param, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { Payload } from '../auth/dto/payload.dto';
import { CrosswordService } from './crossword.service';

@Controller('crossword')
@UseGuards(AuthGuard)
export class CrosswordController {
  constructor(private readonly crosswordService: CrosswordService) {}

  /** GET /crossword — show the most recent puzzle. */
  @Get()
  @Render('crossword')
  async getLatest(@User() user: Payload) {
    const puzzle = await this.crosswordService.getLatestPuzzle(user.userId);
    const all = await this.crosswordService.getAllPuzzles(user.userId);
    return {
      puzzle,
      history: all.slice(1), // everything except the latest
    };
  }

  /** GET /crossword/:weekStartDate — show a specific week's puzzle. */
  @Get(':weekStartDate')
  @Render('crossword')
  async getByWeek(
    @User() user: Payload,
    @Param('weekStartDate') weekStartDate: string,
  ) {
    const puzzle = await this.crosswordService.getPuzzleForWeek(
      user.userId,
      weekStartDate,
    );
    const all = await this.crosswordService.getAllPuzzles(user.userId);
    return {
      puzzle,
      history: all.filter((p) => p.weekStartDate !== weekStartDate),
    };
  }
}
