import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDocumentFieldDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

@IsBoolean()
  required?: string;

  @IsString()
  documentId: string;

  @IsString()
  @IsOptional()
  createdBy?:  Types.ObjectId;
}

export class UpdateDocumentFieldDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsBoolean()
  @IsOptional()
  required?: string;

  @IsString()
  @IsOptional()
  updatedBy?:  Types.ObjectId;
}
