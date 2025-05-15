import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { RoleSeeder } from './seed/role.seeder';
import { SeederService } from './seed/seeder.service';
import { DocumentModule } from './document/document.module';
import { DocumentFieldsModule } from './document-fields/document-fields.module';
import { SchemaModule } from './schema/schema.module';
import { WalletModule } from './wallet/wallet.module';
import { DigitizeModule } from './digitize/digitize.module';
import { CredentialsModule } from './credentials/credentials.module';
import { ConfigModule } from '@nestjs/config';

import developmentConfig from './config/development';
import productionConfig from './config/production';
const environment = process.env.NODE_ENV || 'development';
console.log(environment);

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/hq-attestation'), UserModule, RoleModule, DocumentModule,DocumentFieldsModule, SchemaModule, WalletModule, DigitizeModule, CredentialsModule
    ,ConfigModule.forRoot({
      isGlobal: true,
      load: [environment === 'production' ? productionConfig : developmentConfig],
    }), 
  ],
  providers: [RoleSeeder, SeederService],
 
})
export class AppModule {}
   