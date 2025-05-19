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
import { env } from 'src/config/env';

 
 
 

  @Controller('document')
  export class DocumentController {
    private readonly apiUrl = env.API_ENDPOINT;
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
      @Body() body: { comment: string, userId: string ,role: string },
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
      
      const embedUrl = `${this.apiUrl}/document/view/${id}`;
       
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

//   @Get('/view/:id')
// async getCredentialsNew(@Param('id') id: string, @Res() res: Response) {
//   const isJson = id.endsWith('.json');
//   const isVc = id.endsWith('.vc');
//   const lookupId = isJson || isVc ? id.replace(/\.(json|vc)$/i, '') : id;

//   const data = await this.documentServices.getVerifiableCredential(lookupId);
//   if (!data) {
//     return res.status(404).json({ message: 'Document not found', data: [] });
//   }

//   if (isJson || isVc) {
//     try {
//       const vcData = JSON.parse(data.credentials.credentialVC);
//       return res.json(vcData);
//     } catch (error) {
//       console.error('Error parsing credentialVC:', error);
//       return res.status(500).json({ message: 'Invalid VC format' });
//     }
//   }

//   try {
//     const vcData = JSON.parse(data.credentials.credentialVC);
//     const embedUrl = `${this.apiUrl}/document/view/${id}`;
//     const qrDataUrl = await QRCode.toDataURL(embedUrl);

//     const formFields = Object.entries(vcData.credentialSubject).map(([key, value]) => {
//       if (key === '@context') {
//         return '';
//       }

//       if (
//         typeof value === 'object' &&
//         value !== null &&
//         Object.keys(value).length > 0 &&
//         'mimetype' in value &&
//         typeof (value as any).mimetype === 'string'
//       ) {
//         if ((value as any).mimetype.startsWith("image/")) {
//           const base64 = (value as any).content;
//           const src = `data:${(value as any).mimetype};base64,${base64}`;
//           return `
//             <div class="form-group">
//               <label for="${key}">${key}</label>
//               <div>
//                 <img 
//                   src="${src}" 
//                   alt="${(value as any).originalname}" 
//                   style="max-width: 200px; max-height: 200px; cursor: pointer;" 
//                   onclick="showImageModal('${src}', '${(value as any).originalname}')"
//                 />
//                 <p>${(value as any).originalname} (${Math.round((value as any).size / 1024)} KB)</p>
//               </div>
//             </div>
//           `;
//         }
//       }

//       return `
//         <div class="form-group">
//           <label for="${key}">${key}</label>
//           <input type="text" id="${key}" name="${key}" value="${value}" readonly />
//         </div>
//       `;
//     }).join('');

//     const html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <title>Wallet Credential</title>
//         <style>
//           body {
//             font-family: "Helvetica Neue", sans-serif;
//             background-color: #f7f7f7;
//             margin: 0;
//             padding: 20px;
//           }

//           .header {
//             font-size: 28px;
//             font-weight: bold;
//             color: #1a1a40;
//             margin-bottom: 30px;
//           }

//           .container {
//             display: flex;
//             background-color: white;
//             padding: 40px;
//             border-radius: 8px;
//             max-width: 900px;
//             margin: auto;
//             box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
//           }

//           .qr-container {
//             flex: 0 0 250px;
//             margin-right: 40px;
//           }

//           .qr-container img {
//             width: 250px;
//             height: 250px;
//             border-radius: 10px;
//           }

//           .form-container {
//             flex: 1;
//           }

//           .form-group {
//             margin-bottom: 20px;
//           }

//           label {
//             display: block;
//             font-weight: 600;
//             margin-bottom: 5px;
//             color: #2c2c54;
//           }

//           input {
//             width: 100%;
//             padding: 10px;
//             border: 1px solid #ccc;
//             border-radius: 6px;
//             background-color: #f9f9f9;
//             color: #333;
//             font-size: 14px;
//           }

//           input[readonly] {
//             background-color: #f0f0f0;
//             color: #666;
//           }

//           #imageModal {
//             display: none;
//             position: fixed;
//             top: 0; left: 0;
//             width: 100%; height: 100%;
//             background-color: rgba(0, 0, 0, 0.8);
//             z-index: 1000;
//             justify-content: center;
//             align-items: center;
//           }

//           #imageModal img {
//             max-width: 90%;
//             max-height: 90%;
//           }

//           #imageModal span {
//             position: absolute;
//             top: 20px;
//             right: 30px;
//             font-size: 30px;
//             color: white;
//             cursor: pointer;
//           }

//           #imageModal p {
//             color: white;
//             text-align: center;
//             margin-top: 10px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">Wallet Credential</div>
//         <div class="container">
//           <div class="qr-container">
//             <img src="${qrDataUrl}" alt="QR Code" height="250" width="250" />
//           </div>
//           <div class="form-container">
//             <h1>${vcData.credentialSchema.title.split(":")[0]}</h1>
//             ${formFields}
//           </div>
//         </div>

//         <!-- Modal for full-size image -->
//         <div id="imageModal">
//           <span onclick="closeImageModal()">&times;</span>
//           <img id="modalImage" src="" alt="" />
//           <p id="modalCaption"></p>
//         </div>

//         <script>
//           function showImageModal(src, caption) {
//             const modal = document.getElementById("imageModal");
//             const modalImg = document.getElementById("modalImage");
//             const captionText = document.getElementById("modalCaption");

//             modal.style.display = "flex";
//             modalImg.src = src;
//             captionText.textContent = caption;
//           }

//           function closeImageModal() {
//             document.getElementById("imageModal").style.display = "none";
//           }
//         </script>
//       </body>
//       </html>
//     `;

//     return res.header('Content-Type', 'text/html').send(html);
//   } catch (error) {
//     console.error('QR or HTML generation error:', error);
//     return res.status(500).json({ message: 'Error generating view' });
//   }
// }
@Get('/view/:id')
async getCredentialsNew(@Param('id') id: string, @Res() res: Response) {
  const isJson = id.endsWith('.json');
  const isVc = id.endsWith('.vc');
  const lookupId = isJson || isVc ? id.replace(/\.(json|vc)$/i, '') : id;

  const data = await this.documentServices.getVerifiableCredential(lookupId);
  if (!data) {
    return res.status(404).json({ message: 'Document not found', data: [] });
  }

  if (isJson || isVc) {
    try {
      const vcData = JSON.parse(data.credentials.credentialVC);
      return res.json(vcData);
    } catch (error) {
      console.error('Error parsing credentialVC:', error);
      return res.status(500).json({ message: 'Invalid VC format' });
    }
  }

  try {
    const html = await this.documentServices.generateCredentialHtmlView(
      data.credentials.credentialVC,
      `${this.apiUrl}/document/view/${id}`
    );
    return res.header('Content-Type', 'text/html').send(html);
  } catch (error) {
    console.error('Error generating HTML view:', error);
    return res.status(500).json({ message: 'Error generating view' });
  }
}
  }
  