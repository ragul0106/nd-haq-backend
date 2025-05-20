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
import { SchemaValidationService } from 'src/common/schema-validation.service';
import { env } from '../config/env'; // adjust path as needed
import * as QRCode from 'qrcode';
@Injectable()
export class DocumentService {

  constructor(
    @InjectModel(DocumentTemplate.name)
    private readonly documentModel: Model<DocumentTemplateType>,
    private readonly walletService: WalletService,
    private readonly schemaService: SchemaService,
    private readonly credentialsService: CredentialsService,
    private readonly schemaValidationService: SchemaValidationService

  ) { }

  async createDocument(createDto: Partial<DocumentTemplateType>): Promise<DocumentTemplateType> {
    try {
      if (createDto.imageUrl) {
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

  async getAllDocument(query: any = {}): Promise<any> {
    try {

      const { page = 1, limit = 1000, ...filters } = query;
      const skip = (page - 1) * limit;

      const allDocuments = await this.documentModel
        .find({ ...filters, isActive: true })
        .skip(skip)
        .limit(Number(limit))
        .populate('fields')
        .populate('createdBy')
        .populate('updatedBy')
        .exec();


      const match = { ...filters, isActive: true };

      // run the two queries in parallel
      const [total, docs] = await Promise.all([
        // total number of matching records (no skip/limit)


        this.documentModel.countDocuments(match),

        // current page of documents
        this.documentModel
          .find(match)
          .skip(skip)
          .limit(Number(limit))
          .populate('fields')
          .populate('createdBy')
          .populate('updatedBy')
      ]);
      const returnedDocuments = {
        total,
        page: Number(page),            // current page
        pageSize: docs.length,         // # returned on this page
        totalPages: Math.ceil(total / limit),
        allDocuments
      }

      return returnedDocuments;
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
      console.log(digitizeData.digitizationStatus);

      document.digitizedData = digitizeData.jsonData;
      if (digitizeData.digitizationStatus == 'digitise') {
        document.attesterId = digitizeData.attesterId;
        document.schemaId = digitizeData.documentName;
        if (document.accountId == null || document.accountId == "" || document.accountId == undefined) {
          accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
          if (accountData?.error == 'User does not exist') {
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
        document.documentStatus = DocumentStatus.MakerCompleted;

        document.accountId = accountData.userDetails?.accountId


      } else if (digitizeData.digitizationStatus == 'saved') {
        document.documentStatus = DocumentStatus.MakerSaved;
        document.schemaId = digitizeData.documentName;
      } else if (digitizeData.digitizationStatus == 'reject') {
        document.documentStatus = DocumentStatus.MakerRejected;
        this.walletService.callAgenAppAPI(document.caseId, 1);
      } else if (digitizeData.digitizationStatus == 'issueCredential') {
        let test_cert_data = digitizeData.jsonData
        let schemaData = await this.schemaService.getById(digitizeData.documentName)
        let validSchema = await this.schemaValidationService.validateAndGenerateJSON(schemaData, test_cert_data, env.API_ENDPOINT + document.imageUrl);
        document.dhiwaySchemaId = schemaData.DhiwaySchemaId

        let walletServiceData = await this.walletService.issueVc(schemaData?.DhiwaySchemaId, validSchema.result)
        console.log(walletServiceData, "walletServiceData");
        if (walletServiceData?.error) {
          throw new NotFoundException('Error in issuing VC');
        }
        document.VcId = walletServiceData.identifier; // Assuming walletServiceData is a string, directly assign it
        document.verifiableCredentials = walletServiceData?.vc;
        document.credentialId = walletServiceData?.vc?.id;
        accountData = await this.walletService.seedUser(document.personName, document.personID + "@haqdarshak");
        let addedCreds = await this.walletService.addCredential(accountData.userDetails.did, document.VcId, document.verifiableCredentials, accountData.token)
        console.log(addedCreds, "addedCreds");

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
      console.log(error, "error");

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
        role: commentData.role,           // <-- Add this line
        createdAt: new Date(),
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
        .populate('comments.userId', 'name') // populate only name
        .exec();

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      const comments = (document.comments || []).map(comment => {
        const user = comment.userId as any; // or `as User` if you have User type            
        return {
          comment: comment.comment,
          role: comment.role,
          createdAt: comment.createdAt,
          userName: user?.name || 'Unknown User',
        };
      });

      return comments;
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
      const credential = await this.credentialsService.getCredentialsByCredentialId(credentialId);
      return credential;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return {}
    }
  }

  async getVerifiableCredentialById(credentialId: string): Promise<any> {
    try {
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
  async generateCredentialHtmlView(credentialVC: string, viewUrl: string): Promise<string> {
    const vcData = JSON.parse(credentialVC);
    const qrDataUrl = await QRCode.toDataURL(viewUrl);

    const formFields = Object.entries(vcData.credentialSubject).map(([key, value]) => {
      if (key === '@context') return '';

      if (
        typeof value === 'object' &&
        value !== null &&
        'mimetype' in value &&
        typeof (value as any).mimetype === 'string'
      ) {
        const mimetype = (value as any).mimetype;
        const base64 = (value as any).content;
        const filename = (value as any).originalname || 'document';

        // Image preview + modal
        if (mimetype.startsWith('image/')) {
          const src = `data:${mimetype};base64,${base64}`;
          return `
          <div class="form-group">
            <label for="${key}">${key}</label>
            <div>
              <img 
                src="${src}" 
                alt="${filename}" 
                class="thumbnail"
                onclick="showImageModal('${src}', '${filename}')"
              />
            </div>
          </div>
        `;
        }

        // PDF link
        if (mimetype === 'application/pdf') {
          const pdfUrl = `data:${mimetype};base64,${base64}`;
          return `
          <div class="form-group">
            <label for="${key}">${key}</label>
            <div>
              <a href="${pdfUrl}" download="${filename}" style="color: #1a0dab; text-decoration: underline;">
                Download PDF: ${filename}
              </a>
            </div>
          </div>
        `;
        }
      }

      // Default field
      return `
      <div class="form-group">
        <label for="${key}">${key}</label>
        <input type="text" id="${key}" name="${key}" value="${value}" readonly />
      </div>
    `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Wallet Credential</title>
      <style>
        body {
          font-family: "Helvetica Neue", sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 20px;
        }
        .header {
          font-size: 28px;
          font-weight: bold;
          color: #1a1a40;
          margin-bottom: 30px;
          text-align: center;
        }
        .container {
          display: flex;
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          max-width: 900px;
          margin: auto;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        }
        .qr-container {
          flex: 0 0 250px;
          margin-right: 40px;
        }
        .qr-container img {
          width: 250px;
          height: 250px;
          border-radius: 10px;
        }
        .form-container {
          flex: 1;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 5px;
          color: #2c2c54;
        }
        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background-color: #f9f9f9;
          color: #333;
          font-size: 14px;
        }
        input[readonly] {
          background-color: #f0f0f0;
          color: #666;
        }
        .thumbnail {
          max-width: 120px;
          max-height: 120px;
          cursor: pointer;
          border: 1px solid #ccc;
          border-radius: 6px;
          transition: transform 0.2s;
        }
        .thumbnail:hover {
          transform: scale(1.05);
        }
       #imageModal {
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  overflow-y: scroll;
  padding: 40px 20px;
  box-sizing: border-box;
  justify-content: center;
}

#imageModal img {
   
  display: block;
  margin: 0 auto;
  border-radius: 10px;

}

#imageModal span {
  position: fixed;
  top: 20px;
  right: 30px;
  font-size: 30px;
  color: white;
  cursor: pointer;
  z-index: 1001;
}

#imageModal p {
  color: white;
  text-align: center;
  margin-top: 10px;
}
      </style>
    </head>
    <body>
      <div class="header">Wallet Credential</div>
      <div class="container">
        <div class="qr-container">
          <img src="${qrDataUrl}" alt="QR Code" />
        </div>
        <div class="form-container">
          <h2>${vcData.credentialSchema?.title?.split(":")[0] || 'Credential'}</h2>
          ${formFields}
        </div>
      </div>

      <div id="imageModal">
        <span onclick="closeImageModal()">&times;</span>
        <div style="text-align:center">
          <img id="modalImage" src="" alt="Full Image" />
          <p id="modalCaption"></p>
        </div>
      </div>

      <script>
        function showImageModal(src, caption) {
          document.getElementById("modalImage").src = src;
          document.getElementById("modalCaption").innerText = caption;
          document.getElementById("imageModal").style.display = "flex";
              document.body.style.overflow = "hidden"; // Prevent background scroll

        }

        function closeImageModal() {
          document.getElementById("imageModal").style.display = "none";
              document.body.style.overflow = ""; // Re-enable scroll

        }
      </script>
    </body>
    </html>
  `;

  }

  async dataNotFoundHtml(): Promise<string> {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Data Not Found</title>
      <style>
        body {
          font-family: "Helvetica Neue", sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 40px;
        }
        .not-found-container {
          background: #fff;
          border-radius: 8px;
          max-width: 500px;
          margin: 80px auto;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 0 10px rgba(0,0,0,0.07);
        }
        .not-found-title {
          font-size: 32px;
          color: #c0392b;
          margin-bottom: 16px;
        }
        .not-found-message {
          font-size: 18px;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="not-found-container">
        <div class="not-found-title">Data Not Found</div>
        <div class="not-found-message">
          Sorry, the requested data could not be found.
        </div>
      </div>
    </body>
    </html>
  `;
  }
}
