import { Module } from '@nestjs/common';
import { DocumentFieldsController } from './document-fields.controller';
import { DocumentFieldsService } from './document-fields.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateFieldSchema } from './document-fields.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TemplateField', schema: TemplateFieldSchema }]),
  ],
  exports: [MongooseModule],
  controllers: [DocumentFieldsController],

  providers: [DocumentFieldsService]
})
export class DocumentFieldsModule { }
