import { Module } from '@nestjs/common';
import { DocumentFieldsController } from './document-fields.controller';
import { DocumentFieldsService } from './document-fields.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateFieldSchema } from './document-fields.schema';
import {UserModule} from '../user/user.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TemplateField', schema: TemplateFieldSchema }]),UserModule
  ],
  exports: [MongooseModule],
  controllers: [DocumentFieldsController],

  providers: [DocumentFieldsService]
})
export class DocumentFieldsModule { }
