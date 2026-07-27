import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MediaKind, ServiceType, UrgencyLevel } from '@jardimja/shared';

export class CreateJobDto {
  @ApiProperty({ enum: ServiceType, isArray: true })
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  serviceTypes!: ServiceType[];

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) drawnAreaM2?: number;
}

export class AddMediaDto {
  @ApiProperty({ enum: MediaKind }) @IsEnum(MediaKind) kind!: MediaKind;
  @ApiProperty() @IsString() url!: string;
  @ApiProperty() @IsString() mimeType!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sizeBytes?: number;
}

export class AnalyzeJobDto {
  @ApiPropertyOptional() @IsOptional() @IsString() audioTranscript?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() weather?: string;
}

export class CheckDto {
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
  @ApiProperty() @IsNumber() lat!: number;
  @ApiProperty() @IsNumber() lng!: number;
}
