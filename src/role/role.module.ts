import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from './role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]),
  ],
  exports: [MongooseModule], // <-- this line is key!
  controllers: [RoleController],
  providers: [RoleService]
})
export class RoleModule {}
  