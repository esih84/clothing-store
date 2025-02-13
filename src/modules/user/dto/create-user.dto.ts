import { IsNotEmpty, IsMobilePhone } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "09123456789",
    description: "Mobile number of the user",
  })
  @IsNotEmpty()
  @IsMobilePhone("fa-IR")
  mobile: string;
}
