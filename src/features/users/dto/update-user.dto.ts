import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { ValidateIf, IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password']),
) {
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  declare login?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  declare email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsInt()
  @Min(12)
  declare age?: number;
}
