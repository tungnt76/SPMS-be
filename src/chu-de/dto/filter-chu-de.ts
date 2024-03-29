import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional } from 'class-validator';

export class BaseFilterDto {
  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumberString()
  readonly page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  readonly limit?: number;
}

export class FilterChuDe extends BaseFilterDto {
  @ApiProperty({ required: false, description: ' this field search by Ten ' })
  @IsOptional()
  readonly searchKey?: string;

  @ApiProperty({ required: false })
  @IsNumberString()
  @IsOptional()
  readonly idSyllabus?: number;

  @ApiProperty({ required: false })
  @IsNumberString()
  @IsOptional()
  readonly idLKHGD?: number;

  @ApiProperty({
    required: false
  })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false, description: 'ASC| DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortType?: 'ASC' | 'DESC';
}
