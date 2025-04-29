import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SchemaStatus {
  active = 'active',
  inactive = 'inactive',
}

@Schema({ timestamps: true })
export class SchemaModel {
  @Prop({ type: Object, required: true })
  jsonData: object;

  @Prop({required: true })
  schemaName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ enum: SchemaStatus, default: SchemaStatus.active })
  status: SchemaStatus;
}

export type SchemaDocument = SchemaModel & Document;
export const SchemaSchema = SchemaFactory.createForClass(SchemaModel);
