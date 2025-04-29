import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Digitize {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isProcessed: boolean;

  // Assuming Document and Wallet are separate models
  @Prop({ type: Types.ObjectId, ref: 'Document' })
  document: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  wallet: Types.ObjectId;


  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({  })
  registerSentence: string;

  @Prop({ type: [String], ref: 'Role' })
  role: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Object }) 
  digitizedData: object;

  @Prop()
  attesterId: string;

  @Prop()
   makerId: string; 
  @Prop()
  personId: string;
  @Prop()
  caseId: string;
  
}

export type DigitizeDocument = Digitize & Document;
export const DigitizeSchema = SchemaFactory.createForClass(Digitize);
