import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaModel, SchemaDocument } from './schema.schema';
import { CreateSchemaDto } from './create-schema.dto';

@Injectable()
export class SchemaService {
  constructor(
    @InjectModel(SchemaModel.name)
    private readonly schemaModel: Model<SchemaDocument>,
  ) {}

  async create(dto: CreateSchemaDto): Promise<SchemaModel> {
    const created = new this.schemaModel(dto);
    return created.save();
  }

  async findAll(): Promise<SchemaModel[]> {
    return this.schemaModel.find().exec();
  }
  async getById(id: string): Promise<any> {
    try {
        let fileContent = {
            "@context": {
              "@version": 1.1,
              "@protected": true,
              "type": "@type",
              "schema": "https://schema.org/",
              "IncomeCertificate": {
                "@id": "https://tekdi.github.io/files/vc-schemas/ubi/IncomeCertificate.json#IncomeCertificate"
              },
              "studentId": "schema:Text",
              "schoolId": "schema:Text",
              "certificateId": "schema:Text",
              "fatherName": "schema:Text",
              "motherName": "schema:Text",
              "husbandName": "schema:Text",
              "wifeName": "schema:Text",
              "addressLine1": "schema:Text",
              "vtc": "schema:Text",
              "district": "schema:Text",
              "pin": "schema:Text",
              "state": "schema:Text",
              "country": "schema:Text",
              "casteName": "schema:Text",
              "casteCategory": "schema:Text",
              "totalAnnualFamilyIncome": "schema:Text",
              "incomeFromAgriculture": "schema:Text",
              "incomeFromSalary": "schema:Text",
              "incomeFromTradeBusiness": "schema:Text",
              "incomeFromOtherSources": "schema:Text",
              "orgName": "schema:Text",
              "orgType": "schema:Text",
              "orgOfficerRank": "schema:Text",
              "orgAddressLine1": "schema:Text",
              "orgAddressLine2": "schema:Text",
              "orgDistrict": "schema:Text",
              "orgPin": "schema:Text",
              "orgState": "schema:Text",
              "orgCountry": "schema:Text",
              "issuanceDate": "schema:Text",
              "certificateNumber": "schema:Text",
              "validUpto": "schema:Text"
            }
          }
        
        return fileContent;
    } catch (error) {
        console.error('Error reading file:', error);
        throw new Error('Error reading file');
        
    }
   

}
}
