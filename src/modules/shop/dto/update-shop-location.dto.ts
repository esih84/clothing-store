import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsLatitude,
  IsLongitude,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateShopLocationDto {
  @ApiProperty()
  @IsLatitude()
  @Type(() => Number)
  @Min(25, { message: "Latitude must be at least 25" })
  @Max(40, { message: "Latitude must be at most 40" })
  lat: number;
  @ApiProperty()
  @IsLongitude()
  @Type(() => Number)
  @Min(44, { message: "Longitude must be at least 44" })
  @Max(63, { message: "Longitude must be at most 63" })
  lng: number;

  @ApiProperty()
  @IsString()
  city: string;
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  addressDetails: string;
}
