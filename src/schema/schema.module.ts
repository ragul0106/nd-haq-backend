import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaModel, SchemaSchema } from './schema.schema';
import { SchemaController } from './schema.controller';
import { SchemaService } from './schema.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SchemaModel.name, schema: SchemaSchema }
    ]),
    UserModule
  ],
  controllers: [SchemaController],
  providers: [SchemaService],
  exports: [SchemaService],
})
export class SchemaModule {}
