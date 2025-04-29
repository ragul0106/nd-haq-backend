import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Digitize } from './digitize.schema';
import { WalletService } from '../wallet/wallet.service';
import { DocumentService } from '../document/document.service';
import { Status } from 'src/document/document.schema';
import { log } from 'console';
import { stat } from 'fs';

@Injectable()
export class DigitizeService {
  constructor(
    @InjectModel('Digitize') private readonly digitizeModel: Model<Digitize>,
    private readonly walletService: WalletService,
    private readonly documentService: DocumentService,
  ) {}

  // Create a new digitization request
  async createDigitizeRequest(body: any): Promise<any> {
    try {
      const { personId, caseId, walletId, image, jsonData,documentId,attesterId,makerId,digitizationStatus } = body;
   let  walletNewId=walletId
   console.log(walletId, "walletId")
   console.log(personId, "personId")
    console.log(caseId, "caseId")
    console.log(attesterId,makerId, "image")

    // Check if the wallet exists or create a new one
    if (!walletId) {
      const walletData = await this.walletService.createWallet(body);
      walletNewId = walletData;  // Assign newly created wallet ID
    }

    // Create new digitization request
    const newDigitize = new this.digitizeModel({
      personId,
      caseId,
      wallet: walletNewId,
      image,
      digitizedData: jsonData,
      documentId,
      attesterId,
      makerId,

    });

//update document status    
    const documentData = await this.documentService.getSingleDocument(documentId);
    if (documentData) {
      if(digitizationStatus=='digitise'){

        documentData.status = Status.Success;
      }else if(digitizationStatus=='saved'){

        documentData.status = Status.Saved;
      }else if(digitizationStatus=='reject'){

        documentData.status = Status.Rejected;
      }
      console.log(documentData, "documentData")
    
      await this.documentService.updateDocument(documentId, documentData);
    } else {
      throw new Error('Document not found');
    }


    return await newDigitize.save();
    } catch (error) {
      console.error('Error creating digitization request:', error);
      throw new Error('Failed to create digitization request');
      
    }
  }

  // Fetch single document by ID
  async getDocumentById(documentId: string): Promise<any> {
    return await this.documentService.getSingleDocument(documentId);
  }

  // Process image and store the result
  async processDigitizedImage(imageData: string): Promise<any> {
    // Implement image processing logic (e.g., OCR or other processing)
    return { success: true, imageData };
  }
}
