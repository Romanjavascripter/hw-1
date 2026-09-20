import { Injectable } from "@nestjs/common";
import { IUsersRepository } from "./users.repository.interface.js";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user.entity.js";
import { ILike, Repository } from "typeorm";

@Injectable()
export class UsersRepository implements IUsersRepository{
    constructor(
        @InjectRepository(User)
        private readonly repo:Repository<User>
    ){}

    async findById(id: string): Promise<User | null> {
        return this.repo.findOne({where:{id}})
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repo.findOne({where:{email}})
    }

    async findByLogin(login:string):Promise<User | null>{
        return this.repo.findOne({where:{login}})
    }

    async create(data: Partial<User>): Promise<User> {
        return this.repo.save(data)
    }

    async findByLoginWithPassword(login: string): Promise<User | null> {
        return this.repo.createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.login=:login',{login})
        .getOne()
    }
    async update(id: string, data: Partial<User>): Promise<User | null> {
        await this.repo.update(id, data)
        return this.findById(id)
    }
    async delete(id:string):Promise<void>{
        await this.repo.softDelete(id)
    }

    async findAll(params: { page: number; limit: number; search?: string; }): Promise<{ items: User[]; total: number; }> {
        const {page, limit, search } = params;
        const [items, total] = await this.repo.findAndCount({
             where: search ? { login: ILike(`%${search}%`)}:{},
            skip: (page-1)*limit,
            take:limit,
            order: { createdAt:'DESC'}
        })
        return {items, total}
    }
}