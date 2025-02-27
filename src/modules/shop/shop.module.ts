import { forwardRef, Module } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { ShopController } from "./shop.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";
import { ShopOtp } from "./entities/ShopOtp.entity";
import { ShopFile } from "./entities/shop-file.entity";
import { S3Service } from "../s3/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, ShopOtp, ShopFile]),
    forwardRef(() => AuthModule),

    RoleModule,
  ],
  controllers: [ShopController],
  providers: [ShopService, S3Service],
  exports: [TypeOrmModule, ShopService],
})
export class ShopModule {}
