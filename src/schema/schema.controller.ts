import { Controller,Get } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { Req, Param } from '@nestjs/common';



@Controller('schema')
export class SchemaController {
    constructor(private readonly schemaService: SchemaService) {}
    @Get('getSchema/:id')
    async getSchema(@Param('id') id: string, @Req() req) {
        req.message = 'Schema fetched successfully';
        const schema = await this.schemaService.getById(id);
        return schema;
    }

    
}
