import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentTemplateSchema } from './document.schema';
import { TemplateFieldSchema } from 'src/document-fields/document-fields.schema';
import { WalletModule } from '../wallet/wallet.module';
@Module({
  imports: [
      MongooseModule.forFeature([{ name: 'DocumentTemplate', schema: DocumentTemplateSchema }, { name: 'TemplateField', schema: TemplateFieldSchema },]),
      WalletModule,
    ],
    exports: [MongooseModule,DocumentModule,DocumentService], // <-- this line is key!
  controllers: [DocumentController],
  providers: [DocumentService]
})
export class DocumentModule {}
