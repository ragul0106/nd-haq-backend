import { Controller, Post, Get,Param, Body } from '@nestjs/common';
import { DigitizeService } from './digitize.service';

@Controller('digitize')
export class DigitizeController {
  constructor(private readonly digitizeService: DigitizeService) {}

  @Post()
  async digitizeDocument(@Body() body: any) {
    let data=   await this.digitizeService.createDigitizeRequest(body);
    
    return { message: 'Digitization completed',data };
  }
 @Get('/read/:id')
    async getDocumentById(@Param('id') id: string) {
        const data = await this.digitizeService.getDocumentById(id);
        return { message: 'Document fetched successfully', data };
    }
}
