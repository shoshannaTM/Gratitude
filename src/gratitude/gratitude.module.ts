import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GratitudeService } from './gratitude.service';
import { GratitudeController } from './gratitude.controller';
import { GratitudeEntry } from '../dal/entity/gratitudeEntry.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, MikroOrmModule.forFeature([GratitudeEntry])],
  providers: [GratitudeService],
  controllers: [GratitudeController],
  exports: [GratitudeService],
})
export class GratitudeModule {}
