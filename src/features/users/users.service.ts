import { ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { FindUsersDto, PaginatedDto } from './dto/find-users.dto.js';
import { IUsersRepository } from './users.repository.interface.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entity/user.entity.js';


const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(private usersRepo: IUsersRepository) {}
  async findUsers(query: FindUsersDto): Promise<PaginatedDto> {
    const { search, page, limit } = query;
    const { items, total } = await this.usersRepo.findAll({
      page,
      limit,
      search,
    });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id:string, dto: UpdateUserDto):Promise<Omit<User, 'password'>>{
    try {
        const user = await this.usersRepo.update(id,dto)
        if(!user){
            throw new NotFoundException('User is not found')
        }
        return user
        
    } catch (error) {
        if((error as {code?: string}).code===UNIQUE_VIOLATION) {
            throw new ConflictException('this data is already exists')
        }
        throw error
    }
}
    async delete(id:string):Promise<void>{
        await this.usersRepo.delete(id)
    }
}
