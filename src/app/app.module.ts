import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeormConfig } from "src/configs/typeorm.config";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigModule global
      envFilePath: ".env", // Specify the path to your .env file
    }),
    TypeOrmModule.forRoot(TypeormConfig()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
