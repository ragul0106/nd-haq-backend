import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credential, CredentialDocument } from './credential.schema';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectModel(Credential.name)
    private readonly credentialModel: Model<CredentialDocument>,
  ) {}

  // async getCredentials(personId: string): Promise<any> {
  //   return await this.credentialModel.findOne({ personId }).exec();
  // }

  async saveCredentials(personId: string, credentials: any): Promise<any> {
    const credential = new this.credentialModel({
      personId,
      credentials,
      credentialId: credentials.id,
    });
    return await credential.save();
  }
  
  async getCredentialsByCredentialForOther(credentialId: string): Promise<any> {
    return await this.credentialModel.findOne({ credentialId }).exec();
  }

  async getCredentialsByCredentialId(credentialId: string): Promise<any> {
   try {
    const returnData = await this.credentialModel.findOne({ credentialId }).exec();     
   return returnData
   } catch (error) {
    return null;
   }
  }
}
