import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SchedulerService } from './scheduler.service';
import { KeywordExtractorService } from './keyword-extractor.service';
import { User } from '../dal/entity/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { GratitudeModule } from '../gratitude/gratitude.module';

@Module({
  imports: [
    NotificationModule,
    GratitudeModule,
    MikroOrmModule.forFeature([User]),
    // forwardRef breaks the circular dependency: SchedulerModule ↔ CrosswordModule
    forwardRef(() => require('../crossword/crossword.module').CrosswordModule),
  ],
  providers: [SchedulerService, KeywordExtractorService],
  exports: [KeywordExtractorService, SchedulerService],
})
export class SchedulerModule {}
