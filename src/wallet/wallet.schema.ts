import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WalletStatus {
  MakerNew = 'MakerNew',
  MakerSaved = 'MakerSaved',
  MakerRework = 'MakerRework',
  AttestorNew = 'AttestorNew',
  VCIssued = 'VCIssued',
}

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'DocumentTemplate' })
  documentId: Types.ObjectId;

  @Prop({ type: Object })
  collectedData: object;

  @Prop()
  taskId: string;

  @Prop({ enum: WalletStatus })
  status: WalletStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  walletId: string;

  @Prop()
  personId: string;

  @Prop()
  caseId: string;
 
}

export type WalletDocument = Wallet & Document;
export const WalletSchema = SchemaFactory.createForClass(Wallet);
