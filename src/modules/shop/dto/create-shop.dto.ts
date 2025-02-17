import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Length(2, 60)
  name: string;
}
