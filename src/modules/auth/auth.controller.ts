import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-otp")
  @ApiOperation({ summary: "Send OTP to mobile number" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post("verify-otp")
  @ApiOperation({ summary: "Verify OTP and receive tokens" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  @ApiResponse({ status: 200, description: "OTP verified, tokens issued" })
  verifyOtp(@Body() VerifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(VerifyOtpDto);
  }

  @Post("logout")
  logout() {
    return this.authService.logout();
  }
}
