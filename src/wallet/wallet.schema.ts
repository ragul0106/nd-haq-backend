import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DocumentTemplate } from 'src/document/document.schema';

export enum WalletStatus {
  MakerNew = 'MakerNew',
  MakerSaved = 'MakerSaved',
  MakerRework = 'MakerRework',
  AttestorNew = 'AttestorNew',
  VCIssued = 'VCIssued',
}

@Schema({ timestamps: true })
export class Wallet {
  @Prop()
  documentId: string;

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
  personName: string;
  @Prop()
  agentName: string;
  @Prop()
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })

  @Prop()
  caseId: string;

  @Prop({ type: Types.ObjectId, ref: 'DocumentTemplate' })
 documentObjectID:Types.ObjectId | DocumentTemplate;
 @Prop()
 identifier:string

 @Prop()
 accountToken:string
}

 

export type WalletDocument = Wallet & Document;
export const WalletSchema = SchemaFactory.createForClass(Wallet);
