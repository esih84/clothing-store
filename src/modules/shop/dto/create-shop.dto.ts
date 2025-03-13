import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsNotEmpty, Length, IsNumber } from "class-validator";

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Length(2, 60)
  name: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  categoryId: number;
}
