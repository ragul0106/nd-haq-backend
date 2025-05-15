import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
      UseGuards,
      Res
    } from '@nestjs/common';
  import { Response } from 'express';
  import { DocumentService } from './document.service';
import { JwtAuthGuard } from 'src/user/jwt-auth.guard';
import { CreateDocumentDto, UpdateDocumentDto } from './document.dto';
import * as QRCode from 'qrcode';
 import * as dotenv from 'dotenv';
 dotenv.config();
 

  @Controller('document')
  export class DocumentController {
    constructor(private readonly documentServices: DocumentService) {}
  
    @Post('/create')
    async createDocument(@Body() body: CreateDocumentDto) {
      const data = await this.documentServices.createDocument(body);
      return { message: 'Document created successfully', data };
    }
  
    @Get('/read/all')
    async getAllDocument(@Query() query: any) {
      const data = await this.documentServices.getAllDocument(query);
      return { message: 'Documents fetched successfully', data };
    }
  
    @Get('/read/:id')
    async getSingleDocument(@Param('id') id: string) {
      const data = await this.documentServices.getSingleDocument(id);
      return { message: 'Document fetched successfully', data };
    }
  
    @Patch('/update/:id')
    async updateDocument(
      @Param('id') id: string,
      @Body() body: UpdateDocumentDto,
    ) {
      const data = await this.documentServices.updateDocument(id, body);
      return { message: 'Document updated successfully', data };
    }
  
    @Delete('/delete/:id')
    async deleteDocument(@Param('id') id: string) {
      const data = await this.documentServices.deleteDocument(id);
      return { message: 'Document deleted successfully', data };
    }

    @Put('/digitize/:id')
    async digitizeDocument( @Param('id') id: string,@Body() body: { digitizeStatus: string; digitizeData: any }) {
      const data = await this.documentServices.digitizeDocument(id,body);
      return { message: 'Document digitized successfully', data };
    }

    @Get('/read/documentByStatus/:status')
    async getDocumentByStatus(@Param('status') status: string) {
      const data = await this.documentServices.getDocumentByStatus(status);
      return { message: 'Documents fetched successfully', data };
    }

    @Get('/read/documentByRole/:role/')
    async getDocumentByRole(@Param('role') role: string) {
      const data = await this.documentServices.getDocumentByRole(role);
      return { message: 'Documents fetched successfully', data };
    }

    @Get('/read/documentByRole/:role/:id')
    async getDocumentByAssignedID(@Param('role') role: string, @Param('id') id: string) {
      const data = await this.documentServices.getDocumentByRoleAndAssignedAttester(role, id);
      return { message: 'Documents fetched successfully', data };
    }
    @Put('/addComments/:id')
   async addComments(
      @Param('id') id: string,
      @Body() body: { comment: string, userId: string },
    ) {
       
      const data = await this.documentServices.addComments(id, body);
      return { message: 'Comment added successfully', data };
    }
    @Get('/getCommets/:id') 
    async getComments(@Param('id') id: string) {
      const data = await this.documentServices.getComments(id);
      return { message: 'Comments fetched successfully', data };
    }

    @Get('/documentByUser/:userId')
    async getDocumentByUser(@Param('userId') userId: string) {
      const data = await this.documentServices.getDocumentByUser(userId);
      return { message: 'Documents fetched successfully', data };
    }

    // @Get('/view/:id.json')
    // async getJson(@Param('id') id: string, @Res() res: Response) {        
    //    let data = await this.documentServices.getVerifiableCredential(id)
    //   if(!data){
    //     return res.status(404).json({ error: 'Document not found' });
    //   }          
    //    return res.json(JSON.parse(data.credentials.credentialVC));

       
    // }
    // @Get('/view/:id.vc')
    // async getVC(@Param('id') id: string, @Res() res: Response) {
    //   let data = await this.documentServices.getVerifiableCredential(id)
    //   if(!data){
    //     return res.status(404).json({ error: 'Document not found' });
    //   }      
       
    //   return res.json(JSON.parse(data.credentials.credentialVC));
    //  }
    
 
    @Get('/viewold/:id')
  async getCredentials(@Param('id') id: string, @Res() res: Response) {
    console.log('Requested ID:', id);

    // Determine if request is for .json or .vc version
    const isJson = id.endsWith('.json');
    const isVc = id.endsWith('.vc');

    // Remove extension if needed to get actual DB ID
    const lookupId = isJson || isVc ? id.replace(/\.(json|vc)$/i, '') : id;

    const data = await this.documentServices.getVerifiableCredential(lookupId);
    if (!data) {
      return res.status(404).json({ message: 'Document not found', data: [] });
    }

    // Return only the VC JSON if .json or .vc
    if (isJson || isVc) {
      try {
        const vcData = JSON.parse(data.credentials.credentialVC);
         return res.json(vcData);
      } catch (error) {
        console.error('Error parsing credentialVC:', error);
        return res.status(500).json({ message: 'Invalid VC format' });
      }
    }

    // Otherwise return full original-style response (old format)
    try {
      
      const embedUrl = `${process.env.API_ENDPOINT}/document/view/${id}`;
       
      const qrDataUrl = await QRCode.toDataURL(embedUrl);
      let newData = await this.documentServices.getVerifiableCredentialById(id);
      return res.json({
        result: {
          data: {
            message: 'success',
            data: newData,
            QR: qrDataUrl,
          },
        },
      });
    } catch (error) {
      console.error('QR generation error:', error);
      return res.status(500).json({ message: 'QR generation failed' });
    }
  }

  @Get('/view/:id')
  async getCredentialsNew(@Param('id') id: string, @Res() res: Response) {
    console.log('Requested ID:', id);

    console.log('Requested ID:', id);

    const isJson = id.endsWith('.json');
    const isVc = id.endsWith('.vc');
    const lookupId = isJson || isVc ? id.replace(/\.(json|vc)$/i, '') : id;

    const data = await this.documentServices.getVerifiableCredential(lookupId);
    if (!data) {
      return res.status(404).json({ message: 'Document not found', data: [] });
    }

    // Handle .json and .vc formats
    if (isJson || isVc) {
      try {
        const vcData = JSON.parse(data.credentials.credentialVC);
        return res.json(vcData);
      } catch (error) {
        console.error('Error parsing credentialVC:', error);
        return res.status(500).json({ message: 'Invalid VC format' });
      }
    }

    // Render HTML page with QR and form
    try {
      const vcData = JSON.parse(data.credentials.credentialVC);
      const url = `${process.env.API_ENDPOINT}`;
      const embedUrl = `https://api-attest-uat.haqdarshak.com/document/view/${id}`;
      const qrDataUrl = await QRCode.toDataURL(embedUrl); 
      
      const formFields = Object.entries(vcData.credentialSubject).map(
        ([key, value]) => {
          if (key === '@context') {
            return '';
          }
          return `
          <div class="form-group">
            <label for="${key}">${key}</label>
            <input type="text" id="${key}" name="${key}" value="${value}" readonly />
          </div>
        `
    }).join('');
    let formFieldsOfOriginalVC = Object.entries(vcData.credentialSchema.properties.originalvc).map(
      ([key, value]) => {
        if (key === '@context') {
          return '';
        }
        return `
        <div class="form-group">
          <label for="${key}">${key}</label>
          <input type="text" id="${key}" name="${key}" value="${value}" readonly />
        </div>
      `
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
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
          </style>
        </head>
        <body>
          <div class="header">Wallet Credential</div>
       
          <div class="container">
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" height=500 width=50 />
            </div>
            <div class="form-container">
             <h1> ${vcData.credentialSchema.title.split(":")[0]}</h1>
              ${formFields}
            </div>
          </div>
        </body>
        </html>
      `;

      return res.header('Content-Type', 'text/html').send(html);
    } catch (error) {
      console.error('QR or HTML generation error:', error);
      return res.status(500).json({ message: 'Error generating view' });
    }
  }
  }
  