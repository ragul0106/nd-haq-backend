import {
    ConflictException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    HttpException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DocumentTemplate, DocumentTemplateType } from './document.schema';

@Injectable()
export class DocumentService {
    constructor(
        @InjectModel(DocumentTemplate.name)
        private readonly documentModel: Model<DocumentTemplateType>,
    ) { }

    async createDocument(createDto: Partial<DocumentTemplateType>): Promise<DocumentTemplateType> {
        try {
            const { name, documentType } = createDto;

            const existing = await this.documentModel.findOne({ name, documentType, isActive: true });
            if (existing) {
                throw new ConflictException('Document with this name already exists');
            }

            const document = new this.documentModel({
                ...createDto,
                documentId: uuidv4(),
                isActive: true,
                isApproved: false,
            });

            return await document.save();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error creating document');
        }
    }

    async getAllDocument(query: any = {}): Promise<DocumentTemplateType[]> {
        try {

            const { page = 1, limit = 100 } = query;
            const skip = (page - 1) * limit;
            const allDocuments = await this.documentModel
                .find({...query, isActive: true })
                .skip(skip)
                .limit(Number(limit))
                 .populate('fields')
                .populate('createdBy')
                .populate('updatedBy')
                .exec();
                
            return allDocuments;
        } catch (error) {
            console.log(error, "fff")
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching documents');
        }
    }

    async getSingleDocument(documentId: string): Promise<DocumentTemplateType> {
        try {
          
            const document = await this.documentModel
                .findOne({ documentId, isActive: true })
                .populate('fields')
                .populate('createdBy')
                .populate('updatedBy')
                .exec();

            if (!document) {
                throw new NotFoundException('Document not found');
            }

            return document;
        } catch (error) {
            console.log(error)
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching document');
        }
    }

    async updateDocument(documentId: string, updateDto: Partial<DocumentTemplateType>): Promise<DocumentTemplateType> {
        try {
            const document = await this.documentModel.findOne({ documentId, isActive: true }).exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }

            // If updating `documentFields` as strings, convert to ObjectIds
            if (updateDto.fields && Array.isArray(updateDto.fields)) {
                updateDto.fields = updateDto.fields.map(field =>
                    typeof field === 'string' ? new Types.ObjectId(field) : field,
                );
            }

            Object.assign(document, updateDto);
            return await document.save();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error updating document');
        }
    }

    async deleteDocument(documentId: string): Promise<DocumentTemplateType> {
        try {
            const document = await this.documentModel.findOne({ documentId, isActive: true }).exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }

            document.isActive = false;
            return await document.save();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error deleting document');
        }
    }

}
