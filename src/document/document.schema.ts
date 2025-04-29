import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TemplateField } from 'src/document-fields/document-fields.schema';

export enum DocumentStatus {
  MakerNew = 'MakerNew',
  MakerPending = 'MakerPending',
  MakerSaved = 'MakerSaved',
  MakerRework = 'MakerRework',
  AttestorNew = 'AttestorNew',
  VCIssued = 'VCIssued',
}

export enum Status {
  Saved = 'Saved',
  Pending = 'Pending',
  Success = 'Success',
  Rejected = 'Rejected',
  Rework= 'Rework',
}
@Schema({ timestamps: true })
export class DocumentTemplate {
  @Prop({required: true})
  name: string;

  @Prop({required: true})
  documentType: string;

  @Prop({ type: [Types.ObjectId], ref:TemplateField.name })
  fields: Types.ObjectId[];
   
  @Prop()
  metadata: string;

  @Prop()
  version: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({required: true,default: true})
  isActive: boolean;

  @Prop({ default: false })
  isApproved: boolean;


  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop()
  imageUrl: string;

  @Prop()
  personId: string;

  @Prop()
  transactionId: string;

  @Prop({ type: String, enum: DocumentStatus, default: DocumentStatus.MakerNew })
  documentStatus: DocumentStatus; 


  @Prop({ type: String, enum: Status, default: Status.Pending })
  status: Status; 


  @Prop()
  personID: string;
  @Prop()
  agentID: string;

  @Prop()
  caseId: string;


  @Prop()
  customerName: string;

  @Prop()
  agentName: string;
  
}

export type DocumentTemplateType = DocumentTemplate & Document;
export const DocumentTemplateSchema = SchemaFactory.createForClass(DocumentTemplate);