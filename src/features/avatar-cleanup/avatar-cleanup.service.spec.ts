import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../../providers/s3/s3.service.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { ConfigService } from '@nestjs/config';
import { getLoggerToken } from 'nestjs-pino';

type MockPinoLogger = {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

type MockRepo = {
  find: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

type MockS3 = {
  removeFile: ReturnType<typeof vi.fn>;
};

describe('AvatarCleanupService', () => {
  let service: AvatarCleanupService;
  let mockRepo: MockRepo;
  let mockS3: MockS3;
  let mockPinoLogger: MockPinoLogger;

  beforeEach(async () => {
    mockRepo = {
      find: vi.fn(),
      delete: vi.fn(),
    };
    mockS3 = {
      removeFile: vi.fn(),
    };
    mockPinoLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarCleanupService,
        { provide: getRepositoryToken(Avatar), useValue: mockRepo },
        { provide: S3Service, useValue: mockS3 },
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue(7) },
        },
        {
          provide: getLoggerToken(AvatarCleanupService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<AvatarCleanupService>(AvatarCleanupService);
  });

  it('должен удалять старые аватары пачками и считать успешные удаления', async () => {
    mockRepo.find
      .mockResolvedValueOnce([
        { id: 'avatar-1', objectKey: 'avatars/123.jpg' },
        { id: 'avatar-2', objectKey: 'avatars/421.jpg' },
      ])
      .mockResolvedValueOnce([]);
    mockS3.removeFile.mockResolvedValue(undefined);
    mockRepo.delete.mockResolvedValue(undefined);

    const result = await service.cleanOldAvatars();

    expect(mockS3.removeFile).toHaveBeenCalledTimes(2);
    expect(mockRepo.delete).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ deletedCount: 2, failedCount: 0 });
  });

  it('должен считать ошибки и не зацикливаться, если S3 падает', async () => {
    mockRepo.find
      .mockResolvedValueOnce([{ id: 'avatar-1', objectKey: 'avatars/123.jpg' }])
      .mockResolvedValueOnce([]);
    mockS3.removeFile.mockRejectedValue(new Error('S3 down'));

    const result = await service.cleanOldAvatars();

    expect(mockRepo.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ deletedCount: 0, failedCount: 1 });
  });
});
