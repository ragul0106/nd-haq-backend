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
import { DocumentTemplate, DocumentTemplateType, DocumentStatus } from './document.schema';
import { WalletService } from '../wallet/wallet.service';
import { Wallet } from 'src/wallet/wallet.schema';
import { DocumentComment } from './comment.schema';
 
@Injectable()
export class DocumentService {
    
    constructor(
        @InjectModel(DocumentTemplate.name)
        private readonly documentModel: Model<DocumentTemplateType>,
        private readonly walletService: WalletService    ) { }

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
                documentStatus: DocumentStatus.MakerNew,
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
                .find({ ...query, isActive: true })
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


    async digitizeDocument(documentId: string, digitizeData: any): Promise<DocumentTemplateType> {
        try {
            const document = await this.documentModel.findOne({ documentId, isActive: true }).populate('schemaId','DhiwaySchemaId').exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }
            let accountData;
            document.isApproved = true;
            document.digitizedData = digitizeData.jsonData;

            if (digitizeData.digitizationStatus == 'digitise') {
                console.log("test");
                
                const walletData={
                    "documentId": document.documentId,
                     "personId": document.personID,
                     "documentObjectID":document._id as Types.ObjectId,
                   
                  }
                  
                
             
              let walletResponse =  await this.walletService.saveWallet(walletData);
              console.log(walletResponse,"walletData1");

                document.documentStatus = DocumentStatus.MakerCompleted;
                document.schemaId = digitizeData.documentName;
                document.dhiwaySchemaId = digitizeData.dhiwaySchemaId

                if(document.accountId == null || document.accountId == "" || document.accountId == undefined) {                 
                      await this.walletService.createWallet(document.personID+"@haqdarshak" , document.personName);                       
                    accountData = await this.walletService.seedUser(document.personName, document.personID+"@haqdarshak");

    
               }
                console.log(accountData,"d462a9bd-62e9-4023-bfeb-bdc63123819c");
                
               document.accountId = accountData.userDetails.accountId
               let test_cert_data = {
                    "did"        : accountData.userDetails.did,
                    "name"       : "First test",
                    "address"    : "Apni Gali, Apna Shehar",
                    "issue_date" : "18 Mar 2024",
                    "valid_till" : "19 Mar 2025",
                    "income"     : 1000000
                }
                
             let walletServiceData =   await this.walletService.issueVc(digitizeData.dhiwaySchemaId,  test_cert_data)
                  document.VcId = walletServiceData
                
            } else if (digitizeData.digitizationStatus == 'saved') {
                document.documentStatus = DocumentStatus.MakerSaved;
                document.schemaId = digitizeData.documentName;
            } else if (digitizeData.digitizationStatus == 'reject') {
                document.documentStatus = DocumentStatus.MakerRejected;
            } else if (digitizeData.digitizationStatus == 'issueCredential') {
                accountData = await this.walletService.seedUser(document.personName, document.personID+"@haqdarshak");
                document.documentStatus = DocumentStatus.AttesterVerified;
                digitizeData.documentObjectID = document._id
                
                let digitizedData = {
                    "did"        : document.did,
                    "name"       : "First test",
                    "address"    : "Apni Gali, Apna Shehar",
                    "issue_date" : "18 Mar 2024",
                    "valid_till" : "19 Mar 2025",
                    "income"     : 1000000
                }
                console.log(document);
                let getCreds = await this.walletService.getCredentials(accountData.token)
                let creds = await this.walletService.addCredential(accountData.userDetails.did,document.VcId,getCreds[0].credentialVC,accountData.token)
                     
             
            } else if (digitizeData.digitizationStatus == 'attesterReject') {
                document.documentStatus = DocumentStatus.AttesterRejected;
            } else if (digitizeData.digitizationStatus == 'attesterReword') {
                document.documentStatus = DocumentStatus.AttesterRework;
            }


            return await document.save();
        } catch (error) {
            console.log(error);

            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error digitizing document');
        }
    }
    async getDocumentByStatus(status: string): Promise<DocumentTemplateType[]> {
        try {
            const documents = await this.documentModel
                .find({ documentStatus: status, isActive: true })
                .populate('fields')
                .populate('createdBy')
                .populate('updatedBy')
                .exec();

            if (!documents || documents.length === 0) {
                throw new NotFoundException('No documents found with this status');
            }

            return documents;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching documents by status');
        }
    }
    async getDocumentByRole(role: string): Promise<DocumentTemplateType[]> {
        try {
            const documents = await this.documentModel
                .find({ isActive: true })
                .populate('fields')
                .populate('createdBy')
                .populate('updatedBy')
                .exec();

            if (!documents || documents.length === 0) {
                throw new NotFoundException('No documents found');
            }

            // Filter based on role
            let filteredDocuments: DocumentTemplateType[];

            if (role === 'Attester') {
                const allowedStatuses = ['MakerCompleted', 'AttesterVerified', 'MakerRejected'];
                filteredDocuments = documents.filter(doc => allowedStatuses.includes(doc.documentStatus));
            } else {
                filteredDocuments = documents;
            }
            console.log(role, "role")
            return filteredDocuments;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching documents by role');
        }
    }
    async addComments(documentId: string, commentData: any): Promise<any> {
        try {
            const document = await this.documentModel.findOne({ documentId, isActive: true }).exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }

            console.log(commentData, "commentData");

            const newComment: DocumentComment = {
                comment: commentData.comment,
                userId: new Types.ObjectId(commentData.userId),
                createdAt: new Date()
            };

            if (Array.isArray(document.comments)) {
                document.comments.push(newComment);
            } else {
                document.comments = [newComment];
            }
            await document.save();
            return document.comments;
        } catch (error) {
            console.log(error);

            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error adding comment');
        }
    }
    async getComments(documentId: string): Promise<any> {
        try {

            const document = await this.documentModel.findOne({ documentId, isActive: true }).populate('comments.userId', 'name email mobileNumber').exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }

            return document.comments;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching comments');
        }


    }

}
