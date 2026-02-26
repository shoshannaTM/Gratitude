import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateGratitudeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  entries: string[];

  @IsDateString()
  entryDate: string;
}
