import {
  IsOptional,
  IsBooleanString,
  IsEmail,
  IsMongoId,
  IsIn,
} from 'class-validator';

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

  @IsOptional()
  @IsIn(['asc', 'desc']) // Add this to support sorting
  sortOrder?: 'asc' | 'desc';
}
