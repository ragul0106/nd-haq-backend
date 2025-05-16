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
import { DocumentComment } from './comment.schema';
import { SchemaService } from 'src/schema/schema.service';
import { CredentialsService } from 'src/credentials/credentials.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { logger } from '../logger';
import { json } from 'stream/consumers';

@Injectable()
export class DocumentService {
    
    constructor(
        @InjectModel(DocumentTemplate.name)
        private readonly documentModel: Model<DocumentTemplateType>,
        private readonly walletService: WalletService,
        private readonly schemaService: SchemaService ,
        private readonly credentialsService: CredentialsService
 
    ) { }

    async createDocument(createDto: Partial<DocumentTemplateType>): Promise<DocumentTemplateType> {
        try {
            if(createDto.imageUrl){
                createDto.imageUrl = await this.downloadImageToServer(createDto.imageUrl)
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
            const document = await this.documentModel.findOne({ documentId, isActive: true }).populate('schemaId', 'DhiwaySchemaId').exec();
            if (!document) {
                throw new NotFoundException('Document not found');
            }
            let accountData;
            document.isApproved = true;
            
            logger.info(JSON.stringify(digitizeData));

            document.digitizedData = digitizeData.jsonData;
            if (digitizeData.digitizationStatus == 'digitise') {
                document.attesterId = digitizeData.attesterId;
                let schemaData= await this.schemaService.getById(digitizeData.documentName)
                document.schemaId = digitizeData.documentName;
                document.dhiwaySchemaId = schemaData.DhiwaySchemaId
                if (document.accountId == null || document.accountId == "" || document.accountId == undefined) {
                    accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
                    if(accountData?.error=='User does not exist') {
                         await this.walletService.createWallet(document.personID + "@haqdarshak", document.personName);
                         accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
                         document.accountId = accountData.userDetails.accountId
                    }
                    const walletData = {
                        "documentId": document.documentId,
                        "personId": document.personID,
                        "documentObjectID": document._id as Types.ObjectId,
                        "personName": document.personName,
                        "agentName": document.agentName,
                        "createdAt": new Date()
    
                    }
                 await this.walletService.saveWallet(walletData);
                  
                } else {
                    accountData = await this.walletService.createWallet(document.personID + "@haqdarshak", document.personName);
                    const walletData = {
                        "documentId": document.documentId,
                        "personId": document.personID,
                        "documentObjectID": document._id as Types.ObjectId,
                        "personName": document.personName,
                        "agentName": document.agentName,
                        "createdAt": new Date()
    
                    }
                 await this.walletService.saveWallet(walletData);
                    if (accountData?.error) {
                        accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
                    }
                    document.accountId = accountData.userDetails?.accountId

                }
                document.accountId = accountData.userDetails?.accountId
               
                let test_cert_data = digitizeData.jsonData
                let walletServiceData = await this.walletService.issueVc(schemaData?.DhiwaySchemaId, test_cert_data)
                 
                if (walletServiceData?.error) {
                    console.log("walletServiceData", walletServiceData.error);
                    
                    throw new NotFoundException('Error in issuing VC');
                }
                document.documentStatus = DocumentStatus.MakerCompleted;
                document.VcId = walletServiceData.identifier; // Assuming walletServiceData is a string, directly assign it
                document.verifiableCredentials= walletServiceData?.vc;
                document.credentialId = walletServiceData?.vc?.id;
                
            } else if (digitizeData.digitizationStatus == 'saved') {
                document.documentStatus = DocumentStatus.MakerSaved;
                document.schemaId = digitizeData.documentName;
            } else if (digitizeData.digitizationStatus == 'reject') {
                document.documentStatus = DocumentStatus.MakerRejected;
                this.walletService.callAgenAppAPI(document.caseId, 1);
            } else if (digitizeData.digitizationStatus == 'issueCredential') {                
                accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
                console.log("accountData", accountData);
                
             
              let addedCreds =   await this.walletService.addCredential(accountData.userDetails.did, document.VcId, document.verifiableCredentials, accountData.token)
              console.log("addedCreds", addedCreds);
              
                await this.walletService.updateWalletUserToken(document.personID, accountData.token)
                if (addedCreds.success) {
                    document.documentStatus = DocumentStatus.AttesterVerified;
                    digitizeData.documentObjectID = document._id;
                    const credentials = await this.walletService.getCredentials(accountData.token);
                    await this.credentialsService.saveCredentials(document.personID, credentials[credentials.length - 1]);      
                }
              
              if (addedCreds?.error) {
                    throw new NotFoundException('Error in adding credential');
                } else {
                    document.did = accountData.userDetails.did;
                    document.credentialId = addedCreds?.identifier;
                    document.credentialData = addedCreds;
                }
                 await this.walletService.callAgenAppAPI(document.caseId, 8)              


            } else if (digitizeData.digitizationStatus == 'attesterReject') {
                document.documentStatus = DocumentStatus.MakerPending;
                this.walletService.callAgenAppAPI(document.caseId, 1);
            } else if (digitizeData.digitizationStatus == 'attesterRework') {
                document.documentStatus = DocumentStatus.MakerPending;
            }

             
            return await document.save();
        } catch (error) {      
            console.log("error", error);
                   
            logger.error('Error in digitizing document:', error);
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

                

            const newComment: DocumentComment = {
                comment: commentData.comment,
                userId: commentData.userId,
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

            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error adding comment');
        }
    }
    async getComments(documentId: string): Promise<any> {
        try {
            const document = await this.documentModel
                .findOne({ documentId, isActive: true })
                .populate('comments.userId', 'userId name email mobileNumber role')
                .exec();
    
            if (!document) {
                throw new NotFoundException('Document not found');
            }
    
            const comments = document.comments || [];
    
            return comments; // Return empty array if no comments
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching comments');
        }
    }

    async getDocumentByUser(userId: string): Promise<DocumentTemplateType[]> {
        try {
            const documents = await this.documentModel
                .find({ personID: userId, isActive: true })
                .populate('fields')
                .populate('createdBy')
                .populate('updatedBy')
                .exec();

            if (!documents || documents.length === 0) {
                throw new NotFoundException('No documents found for this user');
            }
        let userData = await this.walletService.seedUser(documents[0].personName, userId + "@haqdarshak");
             if (userData?.error) {
                throw new NotFoundException('User not found');
            }
            const getCreds = await this.walletService.getCredentials(userData.token);
             if (getCreds?.error) {
                throw new NotFoundException('Credentials not found');
            }
            const credential = getCreds[0].credentialVC;
             if (credential?.error) {
            }

            return credential;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error fetching documents by user');
        }
    }
 
async downloadImageToServer(imageUrl: string): Promise<string> {
   
    let saveFolder = 'images';
     let filename = imageUrl.split('/').pop()?.split('?')[0] || 'default.jpg';
     let presignedUrl = imageUrl;
    let baseUrl = process.env.API_ENDPOINT;
    const dir = path.resolve(__dirname, '..', '..', 'public', saveFolder);


  // Ensure the folder exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!filename) {
    throw new Error('Filename could not be determined from the image URL');
  }
  const savePath = path.join(dir, filename);

  try {
    // Download the image and save it to the folder
    const writer = fs.createWriteStream(savePath);

    const response = await axios({
      method: 'GET',
      url: presignedUrl,
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        // Return the URL of the saved image
        const publicUrl = `/${saveFolder}/${filename}`;
        console.log(publicUrl,"publicUrl")
        resolve(publicUrl);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download image from presigned URL: ${error.message}`);
  }
}
async getVerifiableCredential(credentialId: string): Promise<any> {
    try {
        console.log("credentialId", credentialId);
               const credential = await this.credentialsService.getCredentialsByCredentialId(credentialId);
       return credential;
    } catch (error) {
        if (error instanceof HttpException) throw error;    
        return {}
    }
}

async getVerifiableCredentialById(credentialId: string): Promise<any> {
    try {
        console.log("credentialId111", credentialId);
       const credential = await this.credentialsService.getCredentialsByCredentialForOther(credentialId);
       return credential;
    } catch (error) {
        if (error instanceof HttpException) throw error;    
        return {}
    }
}
async getDocumentByRoleAndAssignedAttester(role: string, assignedAttester: string): Promise<DocumentTemplateType[]> {
    try { 
        const documents = await this.documentModel
            .find({ attesterId: assignedAttester, isActive: true })
            .populate('fields')
            .populate('createdBy')
            .populate('updatedBy')
            .exec();

        if (!documents || documents.length === 0) {
            throw new NotFoundException('No documents found for this role and assigned attester');
        }

        return documents;
    } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error fetching documents by role and assigned attester');
    }
}
}
