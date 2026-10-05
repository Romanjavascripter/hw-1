import { BadRequestException } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { validate } from "class-validator"

export async function validateBody<T extends object>(
    dtoClass: new () => T,
    body: unknown
) : Promise<void>{
    const dto = plainToInstance(dtoClass, body??{})
    const errors = await validate(dto,
        {whitelist:true,
        forbidNonWhitelisted:true}
    )
    if (errors.length>0){
        const messages = errors.flatMap((e)=>Object.values(e.constraints?? {}))
        throw new BadRequestException(messages)
    }
}