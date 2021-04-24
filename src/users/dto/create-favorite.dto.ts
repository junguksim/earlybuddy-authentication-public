import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @ApiProperty({
    default : "favorite1"
  })
  readonly favoriteInfo: string;
  @IsNumber()
  @ApiProperty({
    default : 0
  })
  readonly favoriteCategory: number;
  @IsNumber()
  @ApiProperty({
    default : 127.020202002
  })
  readonly favoriteLongitude: number;
  @IsNumber()
  @ApiProperty({
    default : 53.3333333
  })
  readonly favoriteLatitude: number;
}
