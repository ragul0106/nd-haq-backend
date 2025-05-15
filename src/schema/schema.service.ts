import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaModel, SchemaDocument } from './schema.schema';
import { CreateSchemaDto } from './create-schema.dto';
import axios from 'axios';
import { env } from 'src/config/env';





@Injectable()
export class SchemaService {
  private baseUrl: string;
  private authToken: string | null = null;
  private did: string | null = null;
  private userToken: string | null = null;
  private name: string | null = null;
  private accountId: string | null = null;
  private issuerURL =env.API_ISSUER_ENDPOINT
  private issuerToken =env.API_ISSUER_TOKEN
  constructor(
    @InjectModel(SchemaModel.name)
    private readonly schemaModel: Model<SchemaDocument>, 
  ) {}


  setAppToken(token: string) {
    this.authToken = token;
  }

  setAppURL(url: string) {
    this.baseUrl = url;
  }
  async create(dto: any): Promise<SchemaModel> {
   try {
    
    let schema={
      jsonData: dto,
      schemaName: dto.title,
      createdBy: dto.createdBy,
      status: dto.status,
      DhiwaySchemaId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  
     const created = new this.schemaModel(schema);     
    let DhiwaySchemaId = await this.addSchema(dto)    

    let schemas = await created.save();
    schemas.DhiwaySchemaId = DhiwaySchemaId
    await created.save();
    return schemas;



   } catch (error) {
     
    return error
   }
  }

  async findAll(): Promise<SchemaDocument[]>{
    return this.schemaModel.find().exec();

  }

  async getById(id: string): Promise<any> {
    try {
       let schema = await this.schemaModel.findOne({ _id: id }).exec();
        return schema;
    } catch (error) {
         throw new Error('Error reading file');
        
    }
}


async addSchema(schemaData: any): Promise<string> {
  this.setAppToken(this.issuerToken || '');
  this.setAppURL(this.issuerURL || '');
  const url = `${this.baseUrl}/schema`;
  if (!this.authToken) {
    return this._handleMissingToken();
  }
  const headers = new axios.AxiosHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.authToken}`,
  }); 
    
 
  let jsonData ={
    title:schemaData.title,
    description:schemaData.description,
    properties:schemaData.properties
  }
    
  const payload = { schema: jsonData };
  try {
    const response = await axios.post(url, payload, { headers });
    if (
      response.status !== 200 ||
      response.data.result?.toUpperCase() !== 'SUCCESS' ||
      !response.data.schemaId
    ) {
      throw new HttpException('Unexpected result from addSchema', HttpStatus.BAD_REQUEST);
    }

    return response.data.schemaId;
  } catch (error) {
    return "";
  }
}

async getSchema(schemaId: string): Promise<any> {
  this.setAppToken(this.issuerToken || '');
  const url = `${this.baseUrl}/schema/${schemaId}`;

  if (!this.authToken) {
    return this._handleMissingToken();
  }

  const headers = new axios.AxiosHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.authToken}`,
  });

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
     return null;
  }
}

   async testFunction(){
      return "test"
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
 
}
