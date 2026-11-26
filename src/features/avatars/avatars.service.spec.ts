import { Test, TestingModule } from '@nestjs/testing';
import { AvatarsService } from './avatars.service.js';
import { S3Service } from '../../providers/s3/s3.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AvatarsRepository } from './avatars.repository.js';
import { getLoggerToken } from 'nestjs-pino';

type MockAvatarsRepo = {
  countActiveAvatars: ReturnType<typeof vi.fn>;
  findByIdAndUserId: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
  createAvatarInTransaction: ReturnType<typeof vi.fn>;
};

type MockPinoLogger = {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

describe('AvatarsService', () => {
  let service: AvatarsService;
  let mockS3Service: Partial<S3Service>;
  let mockAvatarsRepo: MockAvatarsRepo;
  let mockPinoLogger: MockPinoLogger;

  const mockFile = {
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    mockS3Service = {
      uploadFile: vi.fn(),
      removeFile: vi.fn().mockResolvedValue(undefined),
    };

    mockAvatarsRepo = {
      countActiveAvatars: vi.fn(),
      findByIdAndUserId: vi.fn(),
      softDelete: vi.fn(),
      createAvatarInTransaction: vi.fn(),
    };

    mockPinoLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        { provide: S3Service, useValue: mockS3Service },
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
      mockAvatarsRepo.createAvatarInTransaction.mockResolvedValue({
        id: '123',
        objectKey: 'avatars/123.jpg',
      });

      const result = await service.upload('user-123', mockFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalled();
      expect(mockAvatarsRepo.createAvatarInTransaction).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '123');
    });

    it('ошибка ConflictException, если аватаров уже 5', async () => {
      mockAvatarsRepo.createAvatarInTransaction.mockResolvedValue(null);

      await expect(service.upload('user-123', mockFile)).rejects.toThrow(
        ConflictException,
      );

      expect(mockS3Service.removeFile).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('должен удалить свой аватар(Soft Delete) и очистить S3', async () => {
      const mockAvatar = {
        id: 'avatar-1',
        userId: 'user-123',
        objectKey: 'avatar/123.jpg',
      };
      mockAvatarsRepo.findByIdAndUserId.mockResolvedValue(mockAvatar);

      mockAvatarsRepo.softDelete.mockResolvedValue(true);

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

    it('должен выбросить ошибку, если репозиторий вернул false (affected = 0)', async () => {
      const mockAvatar = {
        id: 'avatar-1',
        userId: 'user-123',
        objectKey: 'avatar/123.jpg',
      };
      mockAvatarsRepo.findByIdAndUserId.mockResolvedValue(mockAvatar);
      mockAvatarsRepo.softDelete.mockResolvedValue(false);

      await expect(service.remove('user-123', 'avatar-1')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockS3Service.removeFile).not.toHaveBeenCalled();
    });
  });
});
