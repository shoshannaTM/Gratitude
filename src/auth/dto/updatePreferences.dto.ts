import { IsInt, IsString, IsTimeZone, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePreferencesDto {
  /** Time in 24-hour "HH:MM" format, e.g. "20:00". */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'promptTime must be in HH:MM format (e.g. 20:00)',
  })
  promptTime: string;

  /** Number of gratitudes per day — minimum 3, maximum 20. */
  @Type(() => Number)
  @IsInt()
  @Min(3, { message: 'You must record at least 3 gratitudes per day.' })
  @Max(20)
  promptCount: number;

  /** Valid IANA timezone string, e.g. "America/New_York". */
  @IsString()
  @IsTimeZone({ message: 'Please select a valid timezone.' })
  timezone: string;
}
