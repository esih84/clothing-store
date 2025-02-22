import { forwardRef, Module } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { ShopController } from "./shop.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";
import { ShopOtp } from "./entities/ShopOtp.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, ShopOtp]),
    forwardRef(() => AuthModule),

    RoleModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [TypeOrmModule, ShopService],
})
export class ShopModule {}
