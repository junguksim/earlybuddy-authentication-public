import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  @ApiProperty({
    default : "testId"
  })
  readonly userId : string;
  @IsString()
  @ApiProperty({
    default : "testPw"
  })
  readonly password : string;

}