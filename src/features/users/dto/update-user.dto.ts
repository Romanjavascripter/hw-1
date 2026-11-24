import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { IsNotEmptyBody } from '../../../common/validators/is-not-empty-body.validator.js';

@IsNotEmptyBody()
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password']),
) {}
