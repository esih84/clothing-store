import { Module } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { AuthModule } from "../auth/auth.module";
import { S3Service } from "../s3/s3.service";
import { RoleModule } from "../role/role.module";
import { ShopModule } from "../shop/shop.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    AuthModule,
    RoleModule,
    ShopModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService, S3Service],
})
export class CategoryModule {}
