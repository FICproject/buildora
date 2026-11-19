import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { WalletTransaction } from '@buildora/types';

@Controller('api/v1/wallet')
export class WalletController {
  @Get()
  getWalletSummary() {
    return {
      success: true,
      data: {
        currentBalance: dbStore.walletBalance,
        availableBalance: dbStore.walletBalance,
        pendingBalance: dbStore.pendingWalletBalance,
        currency: 'INR',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  @Get('transactions')
  getTransactions(
    @Query('type') type?: 'CREDIT' | 'DEBIT',
    @Query('category') category?: string
  ) {
    let result = [...dbStore.walletTransactions];

    if (type) {
      result = result.filter((tx) => tx.type === type);
    }
    if (category && category !== 'ALL') {
      result = result.filter((tx) => tx.category === category);
    }

    return {
      success: true,
      data: result,
      meta: {
        total: result.length,
        currentBalance: dbStore.walletBalance
      }
    };
  }

  @Post('topup')
  topupWallet(@Body() body: { amount: number; paymentReference?: string }) {
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    dbStore.walletBalance += amount;
    const newTx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      referenceNumber: 'WTX-' + Date.now().toString().slice(-8),
      type: 'CREDIT',
      amount,
      category: 'TOPUP',
      status: 'COMPLETED',
      description: `Wallet Top-Up via UPI (${body.paymentReference || 'Instant Bank Transfer'})`,
      createdAt: new Date().toISOString(),
      balanceAfter: dbStore.walletBalance
    };

    dbStore.walletTransactions.unshift(newTx);

    return {
      success: true,
      message: `₹${amount} successfully added to your Buildora Wallet`,
      data: {
        transaction: newTx,
        newBalance: dbStore.walletBalance
      }
    };
  }

  @Post('refund')
  processRefund(@Body() body: { orderId: string; amount: number; reason?: string }) {
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    dbStore.walletBalance += amount;
    const refundTx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      referenceNumber: 'WRF-' + Date.now().toString().slice(-8),
      type: 'CREDIT',
      amount,
      category: 'REFUND',
      status: 'COMPLETED',
      orderId: body.orderId,
      description: `Refund credited for Order #${body.orderId} (${body.reason || 'Material Return / Surplus'})`,
      createdAt: new Date().toISOString(),
      balanceAfter: dbStore.walletBalance
    };

    dbStore.walletTransactions.unshift(refundTx);

    return {
      success: true,
      message: `Refund of ₹${amount} credited to your wallet`,
      data: {
        transaction: refundTx,
        newBalance: dbStore.walletBalance
      }
    };
  }
}
