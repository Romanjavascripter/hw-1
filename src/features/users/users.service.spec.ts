import { Test } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IUsersRepository } from './users.repository.interface.js';
import { ConfigService } from '@nestjs/config';
import { PasswordHasherService } from '../../auth/password-hasher.service.js';
import { getLoggerToken } from 'nestjs-pino';

type mockRepo = {
  findAll: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  findTransferByKey: ReturnType<typeof vi.fn>; // <-- Исправлен тип
  findById: ReturnType<typeof vi.fn>;
};

type mockCache = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

type MockConfig = {
  getOrThrow: ReturnType<typeof vi.fn>;
};

type MockPasswordHasher = {
  hash: ReturnType<typeof vi.fn>;
  compare: ReturnType<typeof vi.fn>;
};

type MockPinoLogger = {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
};

describe('UsersService', () => {
  let mockConfig: MockConfig;
  let mockPasswordHasher: MockPasswordHasher;
  let mockPinoLogger: MockPinoLogger;
  let service: UsersService;
  let repo: mockRepo;
  let mockCacheManager: mockCache;

  beforeEach(async () => {
    repo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findTransferByKey: vi.fn(),
    };

    mockCacheManager = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn(),
      del: vi.fn(),
    };

    mockPasswordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    mockConfig = {
      getOrThrow: vi.fn().mockReturnValue(30000),
    };

    mockPinoLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: IUsersRepository, useValue: repo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ConfigService, useValue: mockConfig },
        { provide: PasswordHasherService, useValue: mockPasswordHasher },
        {
          provide: getLoggerToken(UsersService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('считает totalPages правильвно', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 47 });

    const result = await service.findUsers({ page: 1, limit: 10 });
    expect(result.totalPages).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('передает параметры поиска в репозиторий без искажений', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });

    await service.findUsers({ page: 3, limit: 5, search: 'ale' });
    expect(repo.findAll).toHaveBeenCalledWith({
      page: 3,
      limit: 5,
      search: 'ale',
    });
  });

  it('бросает NotFoundException, если репозиторий вернул null', async () => {
    repo.update.mockResolvedValue(null);

    await expect(service.update('несуществующий id', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deleteUser зовёт repo.delete именно с тем id, который получил', async () => {
    await service.delete('id-123');
    expect(repo.delete).toHaveBeenCalledWith('id-123');
  });
});
