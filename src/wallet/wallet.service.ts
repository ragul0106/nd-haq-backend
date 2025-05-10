import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument, WalletStatus } from './wallet.schema';
import axios from 'axios';

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
      const walletData = await this.walletModel.find({ personId }).populate({ path: 'documentObjectID' }).exec();
      console.log(walletData,"walletData");
      
    if (walletData[0]?.documentObjectID && 'personName' in walletData[0]?.documentObjectID) {
        if (walletData[0]?.documentObjectID?.personName) {
          const accountData = await this.seedUser(walletData[0]?.documentObjectID.personName, walletData[0].documentObjectID.accountId);
          return this.getCredentials(accountData.token);
        }
      }


      return [];
    } catch (error) {

      return error;
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

    const headers = this.buildHeaders(token);
    const payload = this.buildCredentialPayload(did, vcId, vc);

    try {
      const response = await axios.post(url, payload, { headers });
      return response.data;
    } catch (e) {
      return this.handleRequestError(e, 'addCredential');
    }
  }

  async issueVc(schemaId: string, credentialData: any): Promise<string> {
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

      return response.data.identifier;
    } catch (error) {

      return '';
    }
  }

  async saveWallet(data: Partial<Wallet>): Promise<Wallet> {
    const wallet = new this.walletModel(data);
    return wallet.save();
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

  private handleMissingToken(): string {
    return 'Authentication token is required. Please set the token using setAppToken().';
  }

  private handleRequestError(e: any, context: string): any {
    return e.response?.data || { error: 'Request Failed', message: e.message };
  }

  async getAllUsers(): Promise<any[]>  {
    try {
     let personId='PERSON_11111';
      const walletData = await this.walletModel.find({ personId }).exec();

      return walletData;
    } catch (error) {

      return []; // Return an empty array in case of an error
    }
  }
  async callAgenAppAPI(episode_id:string,status:number): Promise<any> { 

    const url = 'https://test.haqdarshak.com/api/microservices/AttestWallet/updateEpisodeStatus';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': 'PHPSESSID=o8s3jt3ppuge798emkeudourf0',
    };
    const data = new URLSearchParams();
    data.append('episode_id', episode_id);
    data.append('status', '7');

    try { 
      const response = await axios.post(url, data, { headers });

      return response.data;
    } catch (error) {

      throw new HttpException('Error calling AgenAPP API', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } 
  async getAllUniqueUsers(): Promise<any[]> {
    try {

       const uniqueUsers = await this.walletModel.distinct('personId');
       return uniqueUsers;
    } catch (error) {

      throw new HttpException('Error fetching unique users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}