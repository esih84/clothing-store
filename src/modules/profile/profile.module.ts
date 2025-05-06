import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";
import { ShopModule } from "../shop/shop.module";
import { Profile } from "./entities/profile.entity";
import { S3Service } from "../s3/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    AuthModule,
    RoleModule,
    ShopModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, S3Service],
})
export class ProfileModule {}
