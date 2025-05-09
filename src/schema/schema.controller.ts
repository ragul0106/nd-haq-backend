import { Body, Controller, Get, Post,Param,Req } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { CreateSchemaDto } from './create-schema.dto';

@Controller('schemas')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post()
  async create(@Body() createSchemaDto: CreateSchemaDto) {   
    return await this.schemaService.create(createSchemaDto);
  }

  @Get('/getAllSchemas')
  async findAll() {
    const schemas = await this.schemaService.findAll(); // Now inferred as SchemaDocument[]
    return schemas
      .filter(schema => schema.schemaName)
      .map(schema => ({
        schemaName: schema.schemaName,
        schema_id: schema._id, // ✅ No TS error
        dhiway_id : schema.DhiwaySchemaId,
        created_at: schema.createdAt,

      }));
  }

  @Get('getSchema/:id')
  async getSchema(@Param('id') id: string, @Req() req) {
      req.message = 'Schema fetched successfully';
      const schema = await this.schemaService.getById(id);
      return schema;
  }
  @Get('getSchemaByName/testFunction')
  async testFunction(){
    return this.schemaService.testFunction()
  }
}
