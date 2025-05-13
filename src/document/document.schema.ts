  import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
  import { Document, Types } from 'mongoose';
  import { TemplateField } from 'src/document-fields/document-fields.schema';
  import { CommentSchema } from './comment.schema';

  import { DocumentComment } from './comment.schema'; // ✅ import here
import { SchemaModel } from 'src/schema/schema.schema';
 

  export enum DocumentStatus {
    MakerNew = 'MakerNew',
    MakerPending = 'MakerPending',
    MakerSaved = 'MakerSaved',
    MakerCompleted = 'MakerCompleted',
    MakerRework = 'MakerRework',
    MakerRejected = 'MakerRejected',
    AttestorNew = 'AttestorNew',
    AttesterVerified = 'AttesterVerified',
    AttesterRejected = 'AttesterRejected',
    AttesterRework = 'AttesterRework',
    AttesterSaved = 'AttesterSaved',
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
    personName: string;

    @Prop()
    agentName: string;

    @Prop({ type: Object }) 
    digitizedData: object;

    @Prop({ type: [CommentSchema], default: [] })
    comments: DocumentComment[];
    
    @Prop({ type: Types.ObjectId,ref: 'SchemaModel' })
    schemaId: Types.ObjectId | SchemaModel;

    @Prop()
    accountId:string;

    @Prop()
    dhiwaySchemaId:string

    @Prop()
    did :string

    @Prop()
    VcId:string

    @Prop({ type: Object })
    verifiableCredentials: object

    @Prop({ type: Object })
    credentialData: object

    @Prop()
    credentialId: string;
    @Prop()
    tokenId: string;
    @Prop()
    attesterId: string;

  }

  export type DocumentTemplateType = DocumentTemplate & Document;
  export const DocumentTemplateSchema = SchemaFactory.createForClass(DocumentTemplate);