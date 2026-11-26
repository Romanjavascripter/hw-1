import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidatePayloadExistsPipe implements PipeTransform<
  unknown,
  unknown
> {
  transform(payload: unknown): unknown {
    if (
      payload === null ||
      typeof payload !== 'object' ||
      Object.keys(payload as object).length === 0
    ) {
      throw new BadRequestException('Payload should not be empty');
    }
    return payload;
  }
}
