import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entity/user.entity.js";
import { IUsersRepository } from "./users.repository.interface.js";
import { UsersRepository } from "./users.repository.js";
import { PassportModule} from "@nestjs/passport";
import { ProfileController } from "./profile.controller.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
    imports:[TypeOrmModule.forFeature([User]), PassportModule.register({})],
    controllers:[ProfileController, UsersController],
    providers:[{provide:IUsersRepository,useClass:UsersRepository}, UsersService],
    exports:[IUsersRepository]

})
export class UsersModule{}