import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { Types } from 'mongoose';
import { SchemaStatus } from './schema.schema';

export class CreateSchemaDto {
  @IsObject()
  jsonData: object;

  @IsNotEmpty()
  createdBy: Types.ObjectId;

  @IsEnum(SchemaStatus)
  status: SchemaStatus;
}
