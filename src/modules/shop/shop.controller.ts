import { Controller, Body, Post } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { Auth } from "src/common/decorators/auth.decorator";

@Controller("shop")
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: "Send OTP to mobile number" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }
}
