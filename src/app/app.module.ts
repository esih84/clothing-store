import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeormConfig } from "src/configs/typeorm.config";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "src/modules/auth/auth.module";
import { UserModule } from "src/modules/user/user.module";
import { RoleModule } from "src/modules/role/role.module";
import { ShopModule } from "src/modules/shop/shop.module";
import { CategoryModule } from "src/modules/category/category.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigModule global
      envFilePath: ".env", // Specify the path to your .env file
    }),
    TypeOrmModule.forRoot(TypeormConfig()),
    AuthModule,
    UserModule,
    ShopModule,
    CategoryModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
