import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone, IsNotEmpty } from "class-validator";

export class SendOtpDto {
  @ApiProperty({ example: "09335674534", description: "mobile number" })
  @IsNotEmpty()
  @IsMobilePhone("fa-IR")
  mobile: string;
}
