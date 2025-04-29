import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { DocumentFieldsService } from './document-fields.service';
import { JwtAuthGuard } from 'src/user/jwt-auth.guard';
import { CreateDocumentFieldDto, UpdateDocumentFieldDto } from './fields.dto';
  
  @Controller('document-fields')
  @UseGuards(JwtAuthGuard)
  export class DocumentFieldsController {
    constructor(private readonly fieldService: DocumentFieldsService) {}
  
    @Post('/create')
    async createField(@Body() body: any) {
      const data = await this.fieldService.createField(body);
      return { message: 'Field created successfully', data };
    }
  
    @Get('/read/all')
    async getAllFields(@Query() query: any) {
      const data = await this.fieldService.getAllFields(query);
      return { message: 'Fields fetched successfully', data };
    }
  
    @Get('/read/:id')
    async getSingleField(@Param('id') id: string) {
      const data = await this.fieldService.getSingleField(id);
      return { message: 'Field fetched successfully', data };
    }
  
    @Patch('/update/:id')
    async updateField(@Param('id') id: string, @Body() body: any) {
      const data = await this.fieldService.updateField(id, body);
      return { message: 'Field updated successfully', data };
    }
  
    @Delete('/delete/:id')
    async deleteField(@Param('id') id: string) {
      const data = await this.fieldService.deleteField(id);
      return { message: 'Field deleted successfully', data };
    }
  }
  