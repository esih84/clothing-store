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
} from "@nestjs/common";
import { BlogService } from "../services/blog.service";
import { CreateBlogDto, UpdateBlogDto } from "../dto/blog.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../../role/enums/role.enum";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";

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

  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.blogService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogService.update(+id, updateBlogDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.blogService.remove(+id);
  }
}
