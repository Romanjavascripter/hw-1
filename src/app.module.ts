import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './features/users/entity/user.entity.js';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath:'.env',
    isGlobal:true
  }),
  TypeOrmModule.forRootAsync({
    inject:[ConfigService],
    useFactory:(config:ConfigService)=>({
      type:'postgres',
      host:config.get<string>('DB_HOST'),
      port:config.get<number>('DB_PORT'),
      username:config.get<string>('DB_USER'),
      password:config.get<string>('DB_PASSWORD'),
      database:config.get<string>('DB_NAME'),
      entities:[User],
      synchronize:true
    }),
  })
  ],
  //controllers: [AppController],
  //providers: [AppService],
})
export class AppModule {}
