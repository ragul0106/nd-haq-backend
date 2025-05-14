import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument, WalletStatus } from './wallet.schema';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class WalletService {
  private baseUrl: string;
  private authToken: string | null = null;
  private did: string | null = null;
  private userToken: string | null = null;
  private name: string | null = null;
  private accountId: string | null = null;
  constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) {}

  setAppToken(token: string): void {
    this.authToken = token;
  }

  setAppURL(url: string): void {
    this.baseUrl = url;
  }
  async getWalletById(id: string): Promise<Wallet> {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async updateWalletStatus(id: string, status: WalletStatus): Promise<Wallet> {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    wallet.status = status;
    return wallet.save();
  }

  async getWalletsByPerson(personId: string): Promise<any[]> {
    try {      
      const walletData = await this.walletModel.findOne({ personId }).populate({ path: 'documentObjectID' }).exec();
      if (walletData) {
        if (walletData.documentObjectID && 'accountId' in walletData.documentObjectID) {
          const accountData = await this.seedUser(walletData.personName, walletData.documentObjectID.accountId);
           if(accountData?.token) {
            const credentials = await this.getCredentials(accountData.token);
            credentials.forEach((credential: any) => {
              credential.token = accountData?.token;
            });

             return credentials;
          }   
        }  
      }  


      return [];
    } catch (error) {

      return [];
    }
  }

  async getWalletsByCase(caseId: string): Promise<Wallet[]> {
    return this.walletModel.find({ caseId });
  }

  async createWallet(accountId: string, name: string): Promise<any> {
    this.initializeApp('https://wallet-api.demo.dhiway.net/api/v1', 'c780754e-4322-4f27-8668-fb0224e126f1');
    const url = `${this.baseUrl}/custom-user/create`;

    const headers = this.buildHeaders();
    const payload = { accountId, name };

    try {
      const response = await axios.post(url, payload, { headers });

      if (response.data.activation !== 'SUCCESS') {
        throw new HttpException('Unexpected result', HttpStatus.BAD_REQUEST);
      }
      this.did = response.data.did;
      this.userToken = response.data.token;
      return response.data;
    } catch (e) {
      return this.handleRequestError(e, 'createWallet');
    }
  }

  async seedUser(name: string, accountId: string): Promise<any> {
    this.initializeApp('https://wallet-api.demo.dhiway.net/api/v1', 'c780754e-4322-4f27-8668-fb0224e126f1');
    const url = `${this.baseUrl}/custom-user/regenerate-token`;
    this.initializeUser(name, accountId);

    const headers = this.buildHeaders();
    const payload = { accountId };

    try {
      const response = await axios.post(url, payload, { headers });
      if (response.status !== 201 || response.data.activation !== 'SUCCESS') {
        throw new HttpException('Unexpected result', HttpStatus.BAD_REQUEST);
      }

      this.did = response.data.userDetails?.did;
      this.userToken = response.data.token;
      return response.data;
    } catch (e) {
      return this.handleRequestError(e, 'seedUser');
    }
  }

  async getCredentials(token: string): Promise<any> {
    this.initializeApp('https://wallet-api.demo.dhiway.net/api/v1', 'c780754e-4322-4f27-8668-fb0224e126f1');
    const url = `${this.baseUrl}/cred`;
    const headers = this.buildHeaders(token);

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (e) {
      return this.handleRequestError(e, 'getCredentials');
    }
  }

  async addCredential(did: string, vcId: string, vc: any, token: any): Promise<any> {
    this.initializeApp('https://wallet-api.demo.dhiway.net/api/v1', 'c780754e-4322-4f27-8668-fb0224e126f1');
    const url = `${this.baseUrl}/message/create/${did}`;

    const headers = this.buildHeaders('c780754e-4322-4f27-8668-fb0224e126f1');
    const payload = this.buildCredentialPayload(did, vcId, vc);

    try {
      const response = await axios.post(url, payload, { headers });
      return response.data;
    } catch (e) {
      return this.handleRequestError(e, 'addCredential');
    }
  }

  async issueVc(schemaId: string, credentialData: any): Promise<any> {
    this.initializeApp('https://issuer-agent-api.demo.dhiway.net/api/v1', 'c780754e-4322-4f27-8668-fb0224e126f1');
    const url = `${this.baseUrl}/cred`;

    if (!this.authToken) {
      return this.handleMissingToken();
    }
    const headers = this.buildHeaders();
    const payload = { schemaId, properties: credentialData };

    try {
      const response = await axios.post(url, payload, { headers });

      if (response.status !== 200 || response.data.result?.toLowerCase() !== 'success' || !response.data.identifier) {
        throw new HttpException('Unexpected result from issueVc', HttpStatus.BAD_REQUEST);
      }
      return response.data;
    } catch (error) {

      return {};
    }
  }

  async saveWallet(data: Partial<Wallet>): Promise<Wallet> {
    //create only if personId does not exist
    const existingWallet = await this.walletModel.findOne({ personId: data.personId });
    if (!existingWallet) {
      const wallet = new this.walletModel(data);
      return wallet.save();
    } else {
      //update the record
      existingWallet.documentId = data.documentId ?? '';
       existingWallet.personId = data.personId ?? '';
      existingWallet.personName = data.personName ?? '';
      existingWallet.agentName = data.agentName ?? '';
      existingWallet.createdAt = data.createdAt ?? new Date();
      
      return existingWallet.save();;
      //retur
     // throw new HttpException('Wallet with this personId already exists', HttpStatus.BAD_REQUEST);
    }


    
  }


  async updateWallet(id: string, identifier: WalletStatus): Promise<Wallet> {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    wallet.identifier = identifier;

    return wallet.save();
  }
  private initializeApp(url: string, token: string): void {
    this.setAppURL(url);
    this.setAppToken(token);
  }

  private initializeUser(name: string, accountId: string): void {
    this.name = name;
    this.accountId = accountId;
    this.did = null;
    this.userToken = null;
  }

  private buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers['Authorization'] = `Bearer ${token || this.authToken}`;
    return headers;
  }

  private buildCredentialPayload(did: string, vcId: string, vc: any): any {
    return {
      id: vcId,
      fromDid: did,
      toDid: did,
      message: { vc },
      details: { meta: '', documentTitle: 'Credential', user: 'custom' },
      type: 'document',
    };
  }

  private handleMissingToken(): object {
    return { error: 'Authentication token is required. Please set the token using setAppToken().' };
  }

  private handleRequestError(e: any, context: string): any {
    return e.response?.data || { error: 'Request Failed', message: e.message };
  }

  async getAllUsers(): Promise<any[]>  {
    try {
     let personId='PERSON_11111';
      const walletData = await this.walletModel.find({ personId }).exec();

      return [walletData];
    } catch (error) {

      return []; // Return an empty array in case of an error
    }
  }
  async callAgenAppAPI(episode_id:string,status:number): Promise<any> { 
    console.log("****************");
    
    console.log(process.env.API_ENDPOINT_AGENT,"process.env.API_ENDPOINT_AGENT");
    console.log("****************");
    
    const url = `${process.env.API_ENDPOINT_AGENT}/microservices/AttestWallet/updateEpisodeStatus`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': 'PHPSESSID=o8s3jt3ppuge798emkeudourf0',
    };
    const data = new URLSearchParams();
    data.append('episode_id', episode_id);
    data.append('status', status.toString());

    try { 
      const response = await axios.post(url, data, { headers });

      return response.data;
    } catch (error) {
      console.log('Error calling AgenAPP API:', error);
      
      throw new HttpException('Error calling AgenAPP API', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } 
  async getAllUniqueUsers(): Promise<any[]> {
    try {
      const uniqueUsers = await this.walletModel.distinct('personId');

      const userDetails = await Promise.all(uniqueUsers.map(async (userId) => {
        const walletData = await this.walletModel.find({ personId: userId }).exec();
        if (walletData.length > 0) {
          const user = walletData[0];
          return {
            id: user.personId,
            userName: user.personName,
            createdBy: user.createdBy,
          };
        }
        return null;
      }));
      return userDetails.filter((user) => user !== null);
    } catch (error) {
      return []; // Return an empty array in case of an error
    }
  }
  async updateWalletUserToken(personId: string, token: string): Promise<Wallet | undefined> {
    try {
      const walletData = await this.walletModel.findOne({ personId }).exec();
      if (walletData !== null) {
        walletData.accountToken = token;
        return walletData.save();
      }
    } catch (error) {
      console.error('Error updating wallet user token:', error);
    }
    return undefined; // Ensure a return value in all code paths
  }
}