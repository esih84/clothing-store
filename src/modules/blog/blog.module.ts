import { Module } from "@nestjs/common";
import { BlogService } from "./services/blog.service";
import { BlogController } from "./controllers/blog.controller";
import { Blog } from "./entities/blog.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { ShopModule } from "../shop/shop.module";
import { RoleModule } from "../role/role.module";
import { CategoryModule } from "../category/category.module";
import { S3Service } from "../s3/s3.service";
import { BlogCategory } from "./entities/blog-category.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, BlogCategory]),
    AuthModule,
    ShopModule,
    RoleModule,
    CategoryModule,
  ],
  controllers: [BlogController],
  providers: [BlogService, S3Service],
})
export class BlogModule {}
