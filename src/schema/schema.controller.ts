import { Body, Controller, Get, Post,Param,Req } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { CreateSchemaDto } from './create-schema.dto';

@Controller('schemas')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post()
  async create(@Body() createSchemaDto: CreateSchemaDto) {
    return this.schemaService.create(createSchemaDto);
  }

  @Get()
  async findAll() {
    //dont return if the schema.schemaName is not there
     return this.schemaService.findAll().then(schemas => schemas.filter(schema => schema.schemaName).map(schema => ({ name: schema.schemaName })));
     //return this.schemaService.findAll().then(schemas => schemas.map(schema => ({ name: schema.schemaName })));
  }

  @Get('getSchema/:id')
  async getSchema(@Param('id') id: string, @Req() req) {
      req.message = 'Schema fetched successfully';
      const schema = await this.schemaService.getById(id);
      return schema;
  }
}
