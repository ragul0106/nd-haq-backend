import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet, WalletStatus } from './wallet.schema';
import { Types } from 'mongoose';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService){}

  // @Post()
  // async createWallet(@Body() walletData: Partial<Wallet>): Promise<Wallet> {
  //   return this.walletService.createWallet(walletData);
  // }

  @Get(':id')
  async getWalletById(@Param('id') id: string): Promise<Wallet> {
    return this.walletService.getWalletById(id);
  }

  @Patch(':id/status')
  async updateWalletStatus(
    @Param('id') id: string,
    @Body('status') status: WalletStatus,
  ): Promise<Wallet> {
    return this.walletService.updateWalletStatus(id, status);
  }

  @Get('person/:personId')
  async getWalletsByPerson(@Param('personId') personId: string): Promise<Wallet[]> {
    let wallet =await this.walletService.getWalletsByPerson(personId);
    

    return wallet;
  }

  @Get('case/:caseId')
  async getWalletsByCase(@Param('caseId') caseId: string): Promise<Wallet[]> {
    return this.walletService.getWalletsByCase(caseId);
  }
}
