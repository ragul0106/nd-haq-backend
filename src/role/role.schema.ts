import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, enum: ['admin', 'maker', 'attestor','schemaCreator'] })
  Role: string;

  @Prop()
  description: string;


  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export type RoleDocument = Role & Document;
export const RoleSchema = SchemaFactory.createForClass(Role);