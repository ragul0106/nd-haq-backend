import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument, WalletStatus } from './wallet.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async createWallet(walletData: Partial<Wallet>): Promise<Wallet> {
    const wallet = new this.walletModel(walletData);
    return wallet.save();
  }

 

  async getWalletById(id: string): Promise<Wallet> {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async updateWalletStatus(id: string, status: WalletStatus): Promise<Wallet> {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    wallet.status = status;
    return wallet.save();
  }

  async getWalletsByPerson(personId: string): Promise<Wallet[]> {
    return this.walletModel.find({ personId });
  }

  async getWalletsByCase(caseId: string): Promise<Wallet[]> {
    return this.walletModel.find({ caseId });
  }
}
