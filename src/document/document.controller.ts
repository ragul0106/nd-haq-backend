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

    @Get('/read/documentByRole/:role')
    async getDocumentByRole(@Param('role') role: string) {
      const data = await this.documentServices.getDocumentByRole(role);
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

    @Get('view/:id.json')
    async getJson(@Param('id') id: string, @Res() res: Response) {  
       let data = await this.documentServices.getVerifiableCredential(id)
      if(!data){
        return res.status(404).json({ error: 'Document not found' });
      }      
      
        data = data.credentialSubject;
    
      return res.json(data);

       
    }
    @Get('view/:id.vc')
    async getVC(@Param('id') id: string, @Res() res: Response) {
      let data = await this.documentServices.getVerifiableCredential(id)
      if(!data){
        return res.status(404).json({ error: 'Document not found' });
      }      
      return res.json(data);
    }
 
  }
  