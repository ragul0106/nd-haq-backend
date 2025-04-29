import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { DocumentService } from './document.service';
  import { WalletService } from 'src/wallet/wallet.service';
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

  }
  