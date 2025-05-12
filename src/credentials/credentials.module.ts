import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Credential, CredentialSchema } from './credential.schema';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Credential.name, schema: CredentialSchema }]),
  ],
  providers: [CredentialsService],
  exports: [CredentialsService], // 👈 So other modules can use it
})
export class CredentialsModule {}
