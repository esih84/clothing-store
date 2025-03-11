import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ShopStatus } from "../enums/shop.enum";

export class UpdateShopDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false, enum: ShopStatus })
  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
