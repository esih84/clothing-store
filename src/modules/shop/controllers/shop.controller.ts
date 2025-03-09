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
  Delete,
} from "@nestjs/common";
import { ShopService } from "../services/shop.service";
import { CreateShopDto } from "../dto/create-shop.dto";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../../role/enums/role.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import {
  FileUploadDto,
  GetShopFilesDto,
  ToggleFilesDto,
} from "../dto/file.dto";
import { FileType } from "../enums/shop-file-type.enum";
import {
  GetShopDocsDto,
  UploadShopContractDto,
  UploadShopDocumentDto,
} from "../dto/document.dto";
import { UpdateShopLocationDto } from "../dto/update-shop-location.dto";
import { UpdateShopDto } from "../dto/update-shop.dto";

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
