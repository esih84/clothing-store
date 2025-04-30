import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { BlogService } from "../services/blog.service";
import { CreateBlogDto, UpdateBlogDto } from "../dto/blog.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../../role/enums/role.enum";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import { paginationDto } from "src/common/dtos/pagination.dto";

@Controller("blog")
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Auth(RoleNames.ADMIN_SHOP, RoleNames.STORE_WORKER)
  @ApiOperation({ summary: "create blog" })
  @ApiResponse({
    status: 200,
    description: "blog created successfully.",
  })
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @Post(":shopId")
  @UseInterceptors(
    UploadFilesInterceptor(
      [{ name: "image", maxCount: 1 }],
      ["image/jpeg", "image/png", "image/jpg"]
    )
  )
  create(
    @Body() createBlogDto: CreateBlogDto,
    @Param("shopId", ParseIntPipe) shopId: number,
    @UploadedFiles() file: { image: Express.Multer.File }
  ) {
    return this.blogService.create(createBlogDto, file.image, shopId);
  }

  @ApiOperation({ summary: "get all blogs" })
  @Get()
  findAll(@Query() paginationDto: paginationDto) {
    return this.blogService.findAll(paginationDto);
  }

  @Get(":blogId")
  findOneById(@Param("blogId", ParseIntPipe) blogId: number) {
    return this.blogService.findOneById(blogId);
  }

  @Get("by-slug/:slug")
  findOneBySlug(@Param("slug") slug: string) {
    return this.blogService.findOneBySlug(slug);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogService.update(+id, updateBlogDto);
  }

  @Auth(RoleNames.ADMIN_SHOP, RoleNames.STORE_WORKER)
  @ApiOperation({ summary: "delete blog" })
  @ApiResponse({
    status: 200,
    description: "Blog deleted successfully",
  })
  @Delete("/:shopId/:blogId")
  softDelete(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Param("blogId", ParseIntPipe) blogId: number
  ) {
    return this.blogService.softDelete(blogId, shopId);
  }
}
