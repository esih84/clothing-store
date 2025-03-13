import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../role/enums/role.enum";
import {
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import { paginationDto } from "src/common/dtos/pagination.dto";

@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Auth(RoleNames.ADMIN)
  @Post()
  @ApiOperation({ summary: "create category" })
  @ApiResponse({
    status: 200,
    description: "Files deleted successfully.",
  })
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @UseInterceptors(
    UploadFilesInterceptor(
      [{ name: "image", maxCount: 1 }],
      ["image/jpeg", "image/png", "image/jpg"]
    )
  )
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFiles()
    file: { image: Express.Multer.File }
  ) {
    return this.categoryService.createCategory(
      createCategoryDto,
      file.image[0]
    );
  }

  @Get()
  @ApiOperation({ summary: "get all categories" })
  @ApiResponse({
    status: 200,
    description: "Categories retrieved successfully.",
  })
  findAll(@Query() paginationDto: paginationDto) {
    return this.categoryService.findAll(paginationDto);
  }

  @Get(":id")
  @ApiOperation({ summary: "get category by id" })
  @ApiQuery({ name: "subcategory", required: false, type: Boolean })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @Query("subcategory", new DefaultValuePipe(false), ParseBoolPipe)
    subcategory?: boolean
  ) {
    return this.categoryService.findOne(id, subcategory);
  }

  @Auth(RoleNames.ADMIN)
  @Patch(":id")
  @ApiOperation({ summary: "update category" })
  @ApiResponse({
    status: 200,
    description: "Category updated successfully.",
  })
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @UseInterceptors(UploadFilesInterceptor([{ name: "image", maxCount: 1 }]))
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFiles()
    file: { image: Express.Multer.File }
  ) {
    return this.categoryService.update(+id, updateCategoryDto, file.image);
  }

  @Auth(RoleNames.ADMIN)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
