import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({timestamps: true})
export class User {
  @Prop()
  name:string;

  @Prop({ required: true }) 
  email: string;

  @Prop()
  mobileNumber: number;

  @Prop({type:{
    fileName: String,
    foldername: String,
  }})
  avatar: { fileName: string; foldername: string };

  @Prop({ required: true })
  userId: string;

  @Prop({required: true,default: true})
  isActive: boolean;

  @Prop({default:false})
  isApproved: boolean;

  @Prop()
  registerSentence: string;
  
  @Prop({ type: [String], ref: 'Role' })
  role: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
  
  @Prop()
  accountCreationReason: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);