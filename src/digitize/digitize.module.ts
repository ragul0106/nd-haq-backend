import { Module } from '@nestjs/common';
import { DigitizeController } from './digitize.controller';
import { DigitizeService } from './digitize.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletModule } from '../wallet/wallet.module';
import { DocumentModule } from '../document/document.module';
import { DigitizeSchema } from './digitize.schema';
import { DocumentService } from '../document/document.service'; // Import DocumentService
import {SchemaModule } from 'src/schema/schema.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Digitize', schema: DigitizeSchema }]),
    WalletModule,  // Import WalletService
    DocumentModule,  // Import DocumentService if needed
    SchemaModule
  ],
  controllers: [DigitizeController],
  providers: [DigitizeService,DocumentService],
})
export class DigitizeModule {}
