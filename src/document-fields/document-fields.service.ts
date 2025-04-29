import {
    Injectable,
    ConflictException,
    NotFoundException,
    InternalServerErrorException,
    HttpException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { TemplateField,TemplateFieldType } from './document-fields.schema';
  import { v4 as uuidv4 } from 'uuid';
  
  @Injectable()
  export class DocumentFieldsService {
    constructor(
      @InjectModel(TemplateField.name)
      private readonly documentFieldModel: Model<TemplateFieldType>,
    ) {}
  
    async createField(createDto: Partial<TemplateFieldType>): Promise<TemplateFieldType> {
      try {
        const existing = await this.documentFieldModel.findOne({
          name: createDto.name,
          isActive: true,
        });
  
        if (existing) {
          throw new ConflictException('Field with this name already exists');
        }
  
        const field = new this.documentFieldModel({
          ...createDto,
          fieldId: uuidv4(),
          isActive: true,
        });
  
        return await field.save();
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error creating document field');
      }
    }
  
    async getAllFields(query: any = {}): Promise<TemplateFieldType[]> {
      try {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
  
        return this.documentFieldModel
          .find({ ...query, isActive: true })
          .skip(skip)
          .limit(Number(limit))
          .populate('createdBy')
          .populate('updatedBy')
          .exec();
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error fetching document fields');
      }
    }
  
    async getSingleField(fieldId: string): Promise<TemplateFieldType> {
      try {
        const field = await this.documentFieldModel
          .findOne({ fieldId, isActive: true })
          .populate('createdBy')
          .populate('updatedBy')
          .exec();
  
        if (!field) {
          throw new NotFoundException('Field not found');
        }
  
        return field;
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error fetching document field');
      }
    }
  
    async updateField(fieldId: string, updateDto: Partial<TemplateFieldType>): Promise<TemplateFieldType> {
      try {
        const field = await this.documentFieldModel.findOne({ fieldId, isActive: true }).exec();
        if (!field) {
          throw new NotFoundException('Field not found');
        }
  
        Object.assign(field, updateDto);
        return await field.save();
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error updating document field');
      }
    }
  
    async deleteField(fieldId: string): Promise<TemplateFieldType> {
      try {
        const field = await this.documentFieldModel.findOne({ fieldId, isActive: true }).exec();
        if (!field) {
          throw new NotFoundException('Field not found');
        }
  
        field.isActive = false;
        return await field.save();
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error deleting document field');
      }
    }
  }
  