import {
  IsNotEmpty,
  IsMobilePhone,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";
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

export class UpdateUserIdentityDto {
  @ApiProperty({ description: "Real name of the user", example: "Ali" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  realName: string;

  @ApiProperty({
    description: "Real family name of the user",
    example: "Ahmadi",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  realFamily: string;
}
