import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaModel, SchemaDocument } from './schema.schema';
import { CreateSchemaDto } from './create-schema.dto';
import axios from 'axios';




@Injectable()
export class SchemaService {
  private baseUrl: string;
  private authToken: string | null = null;
  private did: string | null = null;
  private userToken: string | null = null;
  private name: string | null = null;
  private accountId: string | null = null;
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
  async create(dto: CreateSchemaDto): Promise<SchemaModel> {
   try {
    console.log(dto);
    const created = new this.schemaModel(dto);
    let schemas = await created.save();
    let DhiwaySchemaId = await this.addSchema(dto)  
    schemas.DhiwaySchemaId = DhiwaySchemaId
    return await created.save();



   } catch (error) {
    console.log(error);
    
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
        console.error('Error reading file:', error);
        throw new Error('Error reading file');
        
    }
}


async addSchema(schemaData: any): Promise<string> {
  this.setAppToken('c780754e-4322-4f27-8668-fb0224e126f1')
  this.setAppURL('https://issuer-agent-api.demo.dhiway.net/api/v1');
  const url = `${this.baseUrl}/schema`;
  if (!this.authToken) {
    return this._handleMissingToken();
  }

  const headers = new axios.AxiosHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.authToken}`,
  });
  let schemaData1 = {
    "title": "Income Certificate",
    "description": "Income Certficate",
    "properties": {
      "did": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "address": {
        "type": "string"
      },
      "issue_date": {
        "type": "string"
      },
      "valid_till": {
        "type": "string"
      },
      "income": {
        "type": "integer"
      }
    }
  }
  const payload = { schema: schemaData1 };
  try {
    const response = await axios.post(url, payload, { headers });
    if (
      response.status !== 200 ||
      response.data.result?.toUpperCase() !== 'SUCCESS' ||
      !response.data.schemaId
    ) {
      throw new HttpException('Unexpected result from addSchema', HttpStatus.BAD_REQUEST);
    }
    console.log(response.data.schemaId, "response.data.schemaId");

    return response.data.schemaId;
  } catch (error) {
    console.error('Error creating schema:', error);
    return "";
  }
}

async getSchema(schemaId: string): Promise<any> {
  this.setAppURL('https://issuer-agent-api.demo.dhiway.net/api/v1');
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
    console.error('Error fetching schema:', error.message);
    return null;
  }
}
  

private _handleMissingToken(): string {
  return 'Authentication token is required. Please set the token using setAppToken().';
}

private _handleRequestError(e: any, context: string) {
  console.error(`Error in ${context}:`, e.message);
  return e.response?.data || {
    error: 'Request Failed',
    message: e.message,
  };
}
 
}
