import { IsOptional, IsBooleanString, IsEmail, IsMongoId } from 'class-validator';

export class FindUserQueryDto {
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId()
  role?: string;
}
