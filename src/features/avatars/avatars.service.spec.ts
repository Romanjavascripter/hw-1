import { Repository } from 'typeorm';
import { AvatarsService } from './avatars.service.js';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Service } from '../../providers/s3/s3.service.js';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AvatarsRepository } from './avatars.repository.js';
import { getLoggerToken } from 'nestjs-pino';

type MockAvatarsRepo = {
  countActiveAvatars: ReturnType<typeof vi.fn>;
  findByIdAndUserId: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
};

type MockPinoLogger = {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

describe('AvatarsService', () => {
  let service: AvatarsService;
  let mockAvatarRepository: Partial<Repository<Avatar>>;
  let mockS3Service: Partial<S3Service>;
  let mockDataSource: Partial<DataSource>;
  let mockAvatarsRepo: MockAvatarsRepo;
  let mockPinoLogger: MockPinoLogger;

  const mockFile = {
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    size: 1024,
  } as Express.Multer.File;

  const mockManager = {
    query: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    mockAvatarRepository = {
      findOne: vi.fn(),
      softDelete: vi.fn(),
    };
    mockS3Service = {
      uploadFile: vi.fn(),
      removeFile: vi.fn().mockResolvedValue(undefined),
    };

    mockDataSource = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockManager)),
    };
    mockAvatarsRepo = {
      countActiveAvatars: vi.fn(),
      findByIdAndUserId: vi.fn(),
      softDelete: vi.fn(),
    };

    mockPinoLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        { provide: getRepositoryToken(Avatar), useValue: mockAvatarRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: AvatarsRepository, useValue: mockAvatarsRepo },
        {
          provide: getLoggerToken(AvatarsService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<AvatarsService>(AvatarsService);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('успешно загружает аватар, лимит до 5', async () => {
      mockAvatarsRepo.countActiveAvatars.mockResolvedValue(4);

      mockManager.create.mockResolvedValue({
        id: '123',
        objectKey: 'avatar/123.jpg',
      });
      mockManager.save.mockResolvedValue({
        id: '123',
        objectKey: 'avatars/123.jpg',
      });

      const result = await service.upload('user-123', mockFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalled();
      expect(mockAvatarsRepo.countActiveAvatars).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '123');
    });

    it('ошибка ConflictException, если аватаров уже 5', async () => {
      mockAvatarsRepo.countActiveAvatars.mockResolvedValue(5);

      await expect(service.upload('user-123', mockFile)).rejects.toThrow(
        ConflictException,
      );

      expect(mockS3Service.removeFile).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('должен удалить свой аватар(Soft Delete) и очититть S3', async () => {
      const mockAvatar = {
        id: 'avatar-1',
        userId: 'user-123',
        objectKey: 'avatar/123.jpg',
      };
      mockAvatarsRepo.findByIdAndUserId.mockResolvedValue(mockAvatar);

      const result = await service.remove('user-123', 'avatar-1');

      expect(mockAvatarsRepo.findByIdAndUserId).toHaveBeenCalledWith(
        'avatar-1',
        'user-123',
      );
      expect(mockAvatarsRepo.softDelete).toHaveBeenCalledWith('avatar-1');
      expect(result).toEqual({ success: true, id: 'avatar-1' });
    });
    it('должен выбросить ошибку NotFoundException, если аватар не найден или чужой', async () => {
      mockAvatarsRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.remove('user-123', 'avatar-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAvatarsRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
