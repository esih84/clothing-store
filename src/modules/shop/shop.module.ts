import { Module } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { ShopController } from "./shop.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";

@Module({
  imports: [TypeOrmModule.forFeature([Shop]), AuthModule, RoleModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
