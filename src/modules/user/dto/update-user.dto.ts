import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateRealInfoDto {
  @ApiProperty({ description: "Real name of the user", example: "Ali" })
  @IsString()
  @MinLength(2)
  realName: string;

  @ApiProperty({
    description: "Real family name of the user",
    example: "Ahmadi",
  })
  @IsString()
  @MinLength(2)
  realFamily: string;
}
