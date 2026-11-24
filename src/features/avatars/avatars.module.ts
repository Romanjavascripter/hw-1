import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Module } from '../../providers/s3/s3.module.js';
import { AvatarsController } from './avatars.controller.js';
import { AvatarsService } from './avatars.service.js';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../../auth/auth.module.js';
import { AvatarsRepository } from './avatars.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avatar]),
    S3Module,
    PassportModule,
    AuthModule,
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService, AvatarsRepository],
})
export class AvatarsModule {}
