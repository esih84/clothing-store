import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({ example: "09335674534", description: "mobile number" })
  @IsNotEmpty()
  @IsMobilePhone("fa-IR")
  mobile: string;
  @ApiProperty({ example: "123456", description: "otp code" })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
