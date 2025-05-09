import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet, WalletStatus } from './wallet.schema';
import { Types } from 'mongoose';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

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
    let wallet = await this.walletService.getWalletsByPerson(personId);
    return wallet;
  }

  @Get('/case/:caseId')
  async getWalletsByCase(@Param('caseId') caseId: string): Promise<Wallet[]> {
    return this.walletService.getWalletsByCase(caseId);
  }

  @Get('/allPersons/getAllUsers') 
  async getAllUsers() {
    try {
      let RangomJSon=[
        {
          id: "PERSON_1111333",
          userName: "Arun Acharya",
          agentName: "Dinesh",
          createdBy: "Urvi Lahoti",
          createdAt: "08,May, 2025",
          userImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s",
        },
        {
          id:"PERSON_1111112",
          userName: "Ragul",
          agentName: "Dinesh",
          createdBy: "Urvi Lahoti",
          createdAt: "07,May, 2025",
          userImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s",
        },
        {
          id: "PERSON_11111",
          userName: "Dinesh",
          agentName: "Dinesh",
          createdBy: "Urvi Lahoti",
          createdAt: "06,May, 2025",
          userImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s",
        }
      
      
      ]
      const response =RangomJSon;// await this.walletService.getAllUniqueUsers();
      return response;
    } catch (err) {
      throw new Error('Error fetching comments');
    }
  }

}
