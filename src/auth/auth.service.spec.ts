import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service.js"
import { IUsersRepository } from "../features/users/users.repository.interface.js";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException } from "@nestjs/common";
import { User } from "../features/users/entity/user.entity.js";

describe('AuthService', ()=>{
    let service:AuthService;
    let repo:{create:ReturnType<typeof vi.fn>}

    const dto = {
        login: "lance",
        email:"example@mail.com",
        password:"qwerty123",
        age:20
    }
    beforeEach(async ()=>{
    repo = {create:vi.fn()}
    
    const moduleRef = await Test.createTestingModule({
        providers:[
            AuthService,
            {provide:IUsersRepository, useValue:repo},
            {provide:JwtService, useValue:{sign:vi.fn(()=>'подписанный токен')}},
            {provide:ConfigService, useValue:{
                get:vi.fn(()=>'15m'),
                getOrThrow:vi.fn(()=>'тестовый секрет')
            }
            }
            
        ]
    }).compile()
    service=moduleRef.get(AuthService)
    })
    it('В ответе register нет поля password', async ()=>{
        repo.create.mockImplementation((data)=>Promise.resolve({id:'1', ...data}))

        const result = await service.register(dto)
        expect(result.user).not.toHaveProperty('password')
        expect(result.access_token).toBeDefined()
        expect(result.refresh_token).toBeDefined()
    })

    it('превращает ошибку 23505 в ConflictException ', async ()=>{
        repo.create.mockRejectedValue({code:'23505'})

        await expect(service.register(dto)).rejects.toThrow(ConflictException)
    })

    it('сохраняет пароль в виде bcrypt-хеша, а не открытым текстом', async ()=>{
        repo.create.mockImplementation((data)=>Promise.resolve({id:'1', ...data}));

        await service.register(dto)
        const savedUser = repo.create.mock.calls[0][0]as Partial<User> 

        expect(savedUser.password).not.toBe(dto.password)
        expect(savedUser.password).toMatch(/^\$2[aby]\$/)
        expect(savedUser.password).toHaveLength(60)
    })
})