import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument, WalletStatus } from './wallet.schema';
import axios from 'axios';
import { promises } from 'dns';

@Injectable()
export class WalletService {
  private baseUrl: string;
  private authToken: string | null = null;
  private did: string | null = null;
  private userToken: string | null = null;
  private name: string | null = null;
  private accountId: string | null = null;
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) { }

  setAppToken(token: string) {
    this.authToken = token;
  }

  setAppURL(url: string) {
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
      let credentials=[]
      let walletData = await this.walletModel.find({ personId }).populate({path: 'documentObjectID'})
      .exec();
     
       
    if (walletData[0].documentObjectID && 'personName' in walletData[0].documentObjectID) {
      console.log(walletData[0].documentObjectID.personName,"walletData",walletData[0].documentObjectID);
      let accoundData =   await this.seedUser(walletData[0].documentObjectID.personName,walletData[0].documentObjectID.accountId)
      credentials  = await this.getCredentials(accoundData.token)
     
    } else {
      console.log('personName does not exist on documentObjectID');
    }
    
      return credentials
    } catch (error) {
      console.log(error);
      return error
    }

  }

  async getWalletsByCase(caseId: string): Promise<Wallet[]> {
    return this.walletModel.find({ caseId });
  }

  async checkAccountExists(accountId: string): Promise<any> {
    let response;
    let payload = { accountId: accountId };
    console.log(payload, "payload");

    // Regenerate token for existing wallet
    const regenUrl = process.env.ISSUER_API_URL;

    if (response.data.activation !== 'SUCCESS') {
      throw new Error('Token regeneration failed');
    }

    return response;

  }
  async createWallet(accountId: string, name: string): Promise<any> {
    this.setAppToken("c780754e-4322-4f27-8668-fb0224e126f1");
    this.setAppURL('https://wallet-api.demo.dhiway.net/api/v1');
    const url = `${this.baseUrl}/custom-user/create`;
    const payload = { accountId, name };
    let headers = new axios.AxiosHeaders({
      'Content-Type': 'application/json',
    });

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      return this._handleMissingToken();
    }

    try {
      const response = await axios.post(url, payload, { headers });

      if (response.data.activation !== 'SUCCESS') {
        throw new HttpException('Unexpected result', HttpStatus.BAD_REQUEST);
      }
 

      
      this.did = response.data.did;
      this.userToken = response.data.token;
      return response.data;
    } catch (e) {
console.log(e);

      return this._handleRequestError(e, 'createWallet');
    }
  }

  async seedUser(name: string, accountId: string): Promise<any> {
    this.setAppToken("c780754e-4322-4f27-8668-fb0224e126f1");
    this.setAppURL('https://wallet-api.demo.dhiway.net/api/v1');
    const url = `${this.baseUrl}/custom-user/regenerate-token`;
    this.accountId = accountId;
    this.name = name;
    this.did = null;
    this.userToken = null;

    const payload = { accountId };
    const headers = new axios.AxiosHeaders({
      'Content-Type': 'application/json',
    });

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      return this._handleMissingToken();
    }

    try {
      const response = await axios.post(url, payload, { headers });
      if (response.status !== 201 || response.data.activation !== 'SUCCESS') {
        throw new HttpException('Unexpected result', HttpStatus.BAD_REQUEST);
      }

      this.did = response.data.userDetails?.did;
      this.userToken = response.data.token;
      return response.data;
    } catch (e) {
      return this._handleRequestError(e, 'seedUser');
    }
  }

  async getCredentials(token:string): Promise<any> {
    this.setAppToken("c780754e-4322-4f27-8668-fb0224e126f1");
    this.setAppURL('https://wallet-api.demo.dhiway.net/api/v1');
    const url = `${this.baseUrl}/cred`;
    const headers = new axios.AxiosHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (e) {
      return this._handleRequestError(e, 'getCredentials');
    }
  }

  async addCredential(did: string, vcId: string, vc: any, token: any): Promise<any> {
    this.setAppToken('c780754e-4322-4f27-8668-fb0224e126f1')
    this.setAppURL('https://wallet-api.demo.dhiway.net/api/v1');
    const url = `${this.baseUrl}/message/create/${did}`


    const headers = new axios.AxiosHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
    });

    if (token) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      return this._handleMissingToken();
    }


    const payload = {
      'id': vcId,
      'fromDid': did,
      'toDid': did,
      'message': {
        'vc': {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://cord.network/2023/cred/v1'],
          'type': ['VerifiableCredential'], 
          'issuer': 'did:cord:3z2jGMtb91fA7QUXz518ab9q2MwRpU9cz5i4rpcQbLLkBhDX',
          'issuanceDate': '2025-03-18T06:28:47.000Z',
          'credentialSubject':
            { 'did': 'test1@hq', 'name': 'First test', 'address': 'Apni Gali, Apna Shehar', 'issue_date': '18 Mar 2024', 'valid_till': '19 Mar 2025', 'income': 1000000, 'id': 'did:cord:3z2jGMtb91fA7QUXz518ab9q2MwRpU9cz5i4rpcQbLLkBhDX', '@context': { 'vocab': 'schema:cord:s32k1sQiaEewaM5nYzhvDKcnFut4mxnbUN8URq9DSFNxH255C#' } },
          'validFrom': '2025-03-18T06:28:47.000Z', 'validUntil': '2026-03-18T06:28:47.000Z', 'metadata': {},
          'credentialSchema': {
            '$id': 'schema:cord:s32k1sQiaEewaM5nYzhvDKcnFut4mxnbUN8URq9DSFNxH255C',
            'title': 'Income Certificate:f5ae7309-712d-48c4-9bdc-1a0d80c5b6d9',
            'properties': { 'did': { 'type': 'string' }, 'name': { 'type': 'string' }, 'address': { 'type': 'string' }, 'issue_date': { 'type': 'string' }, 'valid_till': { 'type': 'string' }, 'income': { 'type': 'integer' } }, 'required': [], 'type': 'object', 'additionalProperties': "False",
            '$schema': 'http://cord.network/draft-01/schema#'
          },
          'credentialHash': '0x9c895e8f411020b51f2c78e1995cf31de6f6a0c33ce5c148add9493125912cd4', 
          'id': 'stmt:cord:s3dxnE6S3cVEJKxQ3Yz5VFtfo9DMkgDvai7RjFBG8y61vYTep', 
          'proof': [{ 'type': 'Ed25519Signature2020', 
            'created': 'Tue Mar 18 2025 06:28:47 GMT+0000 (Coordinated Universal Time)', 'proofPurpose': 'sr25519', 'verificationMethod': 'did:cord:3z2jGMtb91fA7QUXz518ab9q2MwRpU9cz5i4rpcQbLLkBhDX#0x06e60a6f16e588711cd60def38154097bbab382b5b93d9cdc15f2e1de2354e35', 'proofValue': 'z5NCXVVhUD3tnrBdueB2NvucJZDqxvCGp1xR9rTuRhzJ24d7fKa6gGcqnHTWUSUCv6xGFv9U4yFDhCnrWz4TtvGsg' }, { 'type': 'CordProof2024', 'elementUri': 'stmt:cord:s3dxnE6S3cVEJKxQ3Yz5VFtfo9DMkgDvai7RjFBG8y61vYTep:9c895e8f411020b51f2c78e1995cf31de6f6a0c33ce5c148add9493125912cd4', 'spaceUri': 'space:cord:c36BVtThSzuW4cuS5B2ddxu4Zvn6tFmvoX3hs4APXm3Me4x2m', 'schemaUri': 'schema:cord:s32k1sQiaEewaM5nYzhvDKcnFut4mxnbUN8URq9DSFNxH255C', 'creatorUri': 'did:cord:3z2jGMtb91fA7QUXz518ab9q2MwRpU9cz5i4rpcQbLLkBhDX', 'digest': '0x9c895e8f411020b51f2c78e1995cf31de6f6a0c33ce5c148add9493125912cd4', 'identifier': 'stmt:cord:s3dxnE6S3cVEJKxQ3Yz5VFtfo9DMkgDvai7RjFBG8y61vYTep',
               'genesisHash': '0x743115aca5f58453993db0b163772f35d086eafefe3b9bc30e304b76453e428a' },
                { 'type': 'CordSDRProof2024', 'defaultDigest': '0x973c9a2d181cc4ed95dd7d18aa4b6f6092e815accde1c15f0d4cc4e54751c0ad', 
                  'hashes': ['0x1cf24e529dd8f55b9d0da240c7ece9ec159e418281ec40bdb6ff3b225426c6e8', '0x20c8e5641655f5d5cfc9c1d5ae8bf33196b30e78ba2f79aa45d1acbd377ac850', '0x215b42bdbd57e619665613ef96cdd46eb02f304eaeff19b28e49e0b0b4abf4c2', '0x7bc2e0720006f77652dadb1aa4b3fc11f7b21cd046df41f96e9d4ee006ce9724', '0xb0a5fe5000138b8e6893dbd7505831a62a78c30dbf689dc7e51812e0067da950', '0xcbf4fbab3463bc2b79b3124062038f42fef740026297e9433039488f5a723a4b', '0xf03d1be293abc4d0d9010299292cb1265c3d87a88fe2333c013cfec5520ac486'], 'nonceMap': { '0xc30b2dee5e979a2fed39b57f1d8196823d8c273a9ff95807c54927edf01a6f8b': '2d12f079-3349-41f8-b290-e4bbfe87e320', '0x829ba30280d2cb03474627a93edaf66a5f626775767c84d6c82f9ddd68a3fc3c': '43a7c84c-a738-4748-b8ba-03a85d7a1028', '0x15633bcaa2630448c65757fe94449784f39e81e342948fb244861621c8242780': 'e6acbd3a-463a-4d8f-8b80-6c1444e69244', '0xaeb71d0ef8ab90c58f73ca951b9bd6dd7eeda8ab76d00bf7a96d3abdbb7a1f84': '27561d98-02de-4995-91b9-b8a17da46a30', '0xfd0a3de95b6df60fe5110c06d6010792a3c95e1ecd6d28532648d55f8cfcecd4': 'b5b346a1-e117-4b46-a503-1ad23e0603aa', '0x2d27f3059506380e342683753e5bda6e2f6d0d184aa82ca5cdca2cdbf624c5b4': '2ff50a65-c2c8-4dca-8545-79de7d0ccc76', '0xfcbe4a6f8ec9cc3cb31064ad3708f6923791040c667820febff869b57a2e2f2e': 'a59146c0-a5a5-496b-9030-7aa43c25c73f' }, 'genesisHash': '0x743115aca5f58453993db0b163772f35d086eafefe3b9bc30e304b76453e428a' }]
        }
      }, 'details': { 'meta': '', 'documentTitle': 'Income Certificate', 'user': 'custom' }, 'type': 'document'
    };

    try {
      const response = await axios.post(url, payload, { headers });
      console.log(response.data,"url");
      return response.data;
    } catch (e) {
      console.log(e);
      
      return this._handleRequestError(e, 'addCredential');
    }
  }


  async issueVc(schemaId: string, credentialData: any): Promise<string> {
    this.setAppToken("c780754e-4322-4f27-8668-fb0224e126f1")
    this.setAppURL('https://issuer-agent-api.demo.dhiway.net/api/v1');
    const url = `${this.baseUrl}/cred`;

    if (!this.authToken) {
      return this._handleMissingToken();
    }
    const headers = new axios.AxiosHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
    });
    const payload = {
      schemaId: schemaId,
      properties: credentialData,
    };

    try {
      const response = await axios.post(url, payload, { headers });

      const result = response.data.result?.toLowerCase();
      if (response.status !== 200 || result !== 'success' || !response.data.identifier) {
        throw new HttpException('Unexpected result from issueVc', HttpStatus.BAD_REQUEST);
      }

      return response.data.identifier;
    } catch (error) {
      console.error('Error issuing VC:', error);
      return "";
    }
  }


  private _handleMissingToken(): string {
    return 'Authentication token is required. Please set the token using setAppToken().';
  }

  private _handleRequestError(e: any, context: string) {
    return e.response?.data || {
      error: 'Request Failed',
      message: e.message,
    };
  }


  async saveWallet(data: Partial<Wallet>): Promise<Wallet> {
    console.log(data,"data");
    
    const wallet = new this.walletModel(data);
    return wallet.save();
  }

  
}
