import {
  Controller,
  Body,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Get,
  Patch,
  Query,
} from "@nestjs/common";
import { ShopService } from "./shop.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../role/enums/role.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import { FileUploadDto, GetShopFilesDto } from "./dto/file.dto";
import { FileType } from "./enums/shop-file-type.enum";
import {
  GetShopDocsDto,
  UploadShopContractDto,
  UploadShopDocumentDto,
} from "./dto/document.dto";
import { UpdateShopLocationDto } from "./dto/update-shop-location.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";

@Controller("shop")
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: "Create shop" })
  @ApiResponse({ status: 200, description: "Shop created successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Patch("/:shopId/update")
  @ApiOperation({ summary: "Update shop details" })
  @ApiResponse({ status: 200, description: "Shop updated successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  updateShop(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() updateShopDto: UpdateShopDto
  ) {
    return this.shopService.updateShop(shopId, updateShopDto);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-file")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @UseInterceptors(UploadFilesInterceptor([{ name: "files", maxCount: 10 }]))
  uploadFiles(
    @Body() fileUploadDto: FileUploadDto,
    @UploadedFiles()
    files: { files: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopService.UploadFile(
      shopId,
      fileUploadDto.fileType,
      files.files
    );
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Patch("/:shopId/files/:fileId/toggle-activation")
  @ApiOperation({ summary: "Toggle file activation(banner, logo, video)" })
  @ApiResponse({
    status: 200,
    description: "File status changed successfully.",
  })
  @ApiResponse({ status: 404, description: "File not found." })
  async toggleFileActivation(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Param("fileId", ParseIntPipe) fileId: number
  ) {
    return this.shopService.toggleFileActivation(shopId, fileId);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Get("/:shopId/files")
  @ApiOperation({ summary: "get shop files based on file type" })
  @ApiResponse({
    status: 200,
    description: "shop file list received successfully",
  })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  findShopFilesByType(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Query() getShopFilesDto: GetShopFilesDto
  ) {
    return this.shopService.findShopFilesByType(shopId, getShopFilesDto);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-document")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @ApiBody({ type: UploadShopDocumentDto })
  @UseInterceptors(UploadFilesInterceptor([{ name: "doc", maxCount: 1 }]))
  uploadShopDocument(
    @UploadedFiles()
    files: { doc: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopService.UploadFile(shopId, FileType.DOC, files.doc);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-contract")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @ApiBody({ type: UploadShopContractDto })
  @UseInterceptors(UploadFilesInterceptor([{ name: "contract", maxCount: 1 }]))
  registerContract(
    @UploadedFiles()
    files: { contract: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopService.UploadFile(
      shopId,
      FileType.CONTRACT,
      files.contract
    );
  }

  @Auth(RoleNames.ADMIN)
  @Patch("/:shopId/files/:fileId/toggle-activation/all")
  @ApiOperation({ summary: "Toggle file activation (all file types)" })
  @ApiResponse({
    status: 200,
    description: "File status changed successfully.",
  })
  @ApiResponse({ status: 404, description: "File not found." })
  toggleFileActivationAdmin(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Param("fileId", ParseIntPipe) fileId: number
  ) {
    return this.shopService.toggleFileActivationAdmin(shopId, fileId);
  }

  @Auth(RoleNames.ADMIN)
  @Get("/:shopId/docs")
  @ApiOperation({ summary: "get shop docs based on file type" })
  @ApiResponse({
    status: 200,
    description: "shop document list received successfully",
  })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  findShopDocsByType(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Query() getShopDocsDto: GetShopDocsDto
  ) {
    return this.shopService.findShopDocsByType(shopId, getShopDocsDto);
  }
  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/update-location")
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  @ApiOperation({ summary: "Update shop location" })
  @ApiResponse({
    status: 200,
    description: "Shop location updated successfully",
  })
  updateShopLocation(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() updateShopLocationDto: UpdateShopLocationDto
  ) {
    return this.shopService.updateShopLocation(shopId, updateShopLocationDto);
  }

  @Auth()
  @Get("/:shopId/location")
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  @ApiOperation({ summary: "Get shop location" })
  @ApiResponse({
    status: 200,
    description: "Shop location retrieved successfully",
  })
  getShopLocation(@Param("shopId", ParseIntPipe) shopId: number) {
    return this.shopService.getShopLocation(shopId);
  }

  @Auth()
  @ApiOperation({ summary: "show all user stores" })
  @ApiResponse({
    status: 200,
    description: "User stores were successfully found.",
  })
  @Get("/find-all-user-shops")
  findAllUserShops() {
    return this.shopService.findAllUserShops();
  }
}
