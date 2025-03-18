import { forwardRef, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserDocument } from "./entities/user-document.entity";
import { S3Service } from "../s3/s3.service";
import { AuthModule } from "../auth/auth.module";
import { ShopModule } from "../shop/shop.module";
import { RoleModule } from "../role/role.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDocument]),
    forwardRef(() => AuthModule),
    ShopModule,
    RoleModule,
  ],
  controllers: [UserController],
  providers: [UserService, S3Service],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
