import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TemplateField {
  @Prop()
  name: string; //adharnumber

  @Prop()
  type: string; //number

  @Prop()
  description: string; //req 16 chanrecter

  @Prop()
  required: boolean; 

  @Prop()
  documentId: string;

  @Prop()
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export type TemplateFieldType = TemplateField & Document;
export const TemplateFieldSchema = SchemaFactory.createForClass(TemplateField);