import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class UpdateUserDto {
  @IsString()
  @ApiProperty({
    default : "setNameTest"
  })
  readonly username : string;
}