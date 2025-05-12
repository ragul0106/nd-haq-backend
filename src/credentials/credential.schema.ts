import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CredentialDocument = Credential & Document;

@Schema()
export class Credential {
    @Prop()
    personId: string;

    @Prop({ type: Object })
    credentials: object;

    @Prop()
    credentialId: string;
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);
