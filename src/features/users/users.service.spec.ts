import { Test } from '@nestjs/testing';
import { UsersService } from "./users.service.js"
import { TestScheduler } from "rxjs/testing";
import { IUsersRepository } from './users.repository.interface.js';
import { NotFoundException } from '@nestjs/common';

describe("UsersService", ()=>{
    let service:UsersService;
    let repo: {findAll:ReturnType<typeof vi.fn>, update:ReturnType<typeof vi.fn>, delete:ReturnType<typeof vi.fn>}

    beforeEach(async ()=>{
        repo= {
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        }
        const moduleRef = await Test.createTestingModule({
            providers:[
                UsersService, {provide: IUsersRepository,
                    useValue:repo
                }
            ]
        }).compile()
        service = moduleRef.get(UsersService)
})
it('считает totalPages правильвно', async ()=>{
repo.findAll.mockResolvedValue({items:[], total:47});

const result = await service.findUsers({page:1, limit:10})
expect(result.totalPages).toBe(5);
expect(result.page).toBe(1);
expect(result.limit).toBe(10)
})

it('передает параметры поиска в репозиторий без искажений', async ()=>{
    repo.findAll.mockResolvedValue({items:[], total:0})

    await service.findUsers({page:3, limit:5, search:'ale'})
    expect(repo.findAll).toHaveBeenCalledWith({page:3, limit:5, search:'ale'})
})

it('бросает NotFoundException, если репозиторий вернул null', async ()=>{
    repo.update.mockResolvedValue(null)

    await expect(service.update('несуществующий id', ({}))).rejects.toThrow(NotFoundException)
})

it('deleteUser зовёт repo.delete именно с тем id, который получил', async ()=>{
    await service.delete('id-123')
    expect(repo.delete).toHaveBeenCalledWith('id-123')
})
})