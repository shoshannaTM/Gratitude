import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CrosswordService } from './crossword.service';
import { CrosswordController } from './crossword.controller';
import { CrosswordGeneratorService } from './crossword-generator.service';
import { CrosswordPuzzle } from '../dal/entity/crosswordPuzzle.entity';
import { AuthModule } from '../auth/auth.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    AuthModule,
    SchedulerModule,
    MikroOrmModule.forFeature([CrosswordPuzzle]),
  ],
  providers: [CrosswordService, CrosswordGeneratorService],
  controllers: [CrosswordController],
  exports: [CrosswordService],
})
export class CrosswordModule {}
