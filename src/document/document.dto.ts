import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
  } from 'class-validator';
import { Types } from 'mongoose';
  
  export class CreateDocumentDto {
    @IsString()
    name: string;
  
    @IsString()
    documentType: string;
  
    @IsArray()
    @IsOptional()
    documentFields?: Types.ObjectId[];
  
    @IsString()
    @IsOptional()
    metadata?: string;
  
    @IsString()
    @IsOptional()
    version?: string;
  
    @IsUUID()
    @IsOptional()
    documentId?: string;
  
    @IsBoolean()
    @IsOptional()
    isApproved?: boolean;
  
    @IsString()
    @IsOptional()
    createdBy?: Types.ObjectId;
  }
  
  export class UpdateDocumentDto {
    @IsString()
    @IsOptional()
    name?: string;
  
    @IsString()
    @IsOptional()
    documentType?: string;
  
    @IsArray()
    @IsOptional()
    documentFields?: Types.ObjectId[];
  
    @IsString()
    @IsOptional()
    metadata?: string;
  
    @IsString()
    @IsOptional()
    version?: string;
  
    @IsBoolean()
    @IsOptional()
    isApproved?: boolean;
  
    @IsString()
    @IsOptional()
    updatedBy?: Types.ObjectId;
  }
  