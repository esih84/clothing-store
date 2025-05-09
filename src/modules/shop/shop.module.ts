import { forwardRef, Module } from "@nestjs/common";
import { ShopService } from "./services/shop.service";
import { ShopController } from "./controllers/shop.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { AuthModule } from "../auth/auth.module";
import { RoleModule } from "../role/role.module";
import { ShopFile } from "./entities/shop-file.entity";
import { S3Service } from "../s3/s3.service";
import { ShopLocation } from "./entities/Shop-location.entity";
import { ShopFileService } from "./services/shop-file.service";
import { ShopFileController } from "./controllers/shop-file.controller";
import { CategoryService } from "../category/category.service";
import { Category } from "../category/entities/category.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, ShopFile, ShopLocation, Category]),
    forwardRef(() => AuthModule),

    RoleModule,
  ],
  controllers: [ShopController, ShopFileController],
  providers: [ShopService, ShopFileService, S3Service, CategoryService],
  exports: [TypeOrmModule, ShopService, ShopFileService],
})
export class ShopModule {}
