import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActiveUsersQueryDto {
  @ApiProperty({
    example: 18,
    minimum: 0,
    maximum: 150,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  minAge: number;

  @ApiProperty({
    example: 30,
    minimum: 0,
    maximum: 150,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  maxAge: number;
}
