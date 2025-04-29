import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentTemplateSchema } from './document.schema';
import { TemplateFieldSchema } from 'src/document-fields/document-fields.schema';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'DocumentTemplate', schema: DocumentTemplateSchema }
         , { name: 'TemplateField', schema: TemplateFieldSchema }, // ✅ Add this line

      ]),
    ],
    exports: [MongooseModule], // <-- this line is key!
  controllers: [DocumentController],
  providers: [DocumentService]
})
export class DocumentModule {}
