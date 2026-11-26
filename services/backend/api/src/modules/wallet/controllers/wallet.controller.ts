import { Controller, Get, Post, Body, Query, BadRequestException, Headers } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { WalletTransaction } from '@buildora/types';
import { verifyCustomerToken } from '../../../common/customer-auth.util';
import {
  PlatformWalletTxnModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';

@Controller('api/v1/wallet')
export class WalletController {
  @Get()
  getWalletSummary(@Headers('authorization') authHeader?: string) {
    const cust = verifyCustomerToken(authHeader);
    const customerRecord = cust ? companyAdminDataService.customers.get(cust.sub) : undefined;
    const balance = customerRecord ? customerRecord.walletBalance : dbStore.walletBalance;

    return {
      success: true,
      data: {
        currentBalance: balance,
        availableBalance: balance,
        pendingBalance: dbStore.pendingWalletBalance,
        currency: 'INR',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  @Get('transactions')
  getTransactions(
    @Headers('authorization') authHeader?: string,
    @Query('type') type?: 'CREDIT' | 'DEBIT',
    @Query('category') category?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    let result = [...dbStore.walletTransactions];
    if (cust?.sub) {
      const scoped = result.filter((tx: any) => !tx.customerId || tx.customerId === cust.sub);
      result = scoped;
    }

    if (type) {
      result = result.filter((tx) => tx.type === type);
    }
    if (category && category !== 'ALL') {
      result = result.filter((tx) => tx.category === category);
    }

    const customerRecord = cust ? companyAdminDataService.customers.get(cust.sub) : undefined;
    const balance = customerRecord ? customerRecord.walletBalance : dbStore.walletBalance;

    return {
      success: true,
      data: result,
      meta: {
        total: result.length,
        currentBalance: balance,
      },
    };
  }

  @Post('topup')
  async topupWallet(
    @Body() body: { amount: number; paymentReference?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    const cust = verifyCustomerToken(authHeader);
    const customerRecord = cust ? companyAdminDataService.customers.get(cust.sub) : undefined;
    if (customerRecord) {
      customerRecord.walletBalance = Number(customerRecord.walletBalance || 0) + amount;
    }
    dbStore.walletBalance += amount;
    const nextBalance = customerRecord ? customerRecord.walletBalance : dbStore.walletBalance;

    const newTx: WalletTransaction & { customerId?: string } = {
      id: 'tx-' + Date.now(),
      customerId: cust?.sub,
      referenceNumber: 'WTX-' + Date.now().toString().slice(-8),
      type: 'CREDIT',
      amount,
      category: 'TOPUP',
      status: 'COMPLETED',
      description: `Wallet Top-Up via UPI (${body.paymentReference || 'Instant Bank Transfer'})`,
      createdAt: new Date().toISOString(),
      balanceAfter: nextBalance,
    };

    dbStore.walletTransactions.unshift(newTx);
    await platformPersistenceService.upsert(PlatformWalletTxnModel, newTx);

    return {
      success: true,
      message: `₹${amount} successfully added to your Buildora Wallet`,
      data: {
        transaction: newTx,
        newBalance: nextBalance,
      },
    };
  }

  @Post('refund')
  async processRefund(
    @Body() body: { orderId: string; amount: number; reason?: string; customerId?: string }
  ) {
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    const customerRecord = body.customerId
      ? companyAdminDataService.customers.get(body.customerId)
      : undefined;
    if (customerRecord) {
      customerRecord.walletBalance = Number(customerRecord.walletBalance || 0) + amount;
    }
    dbStore.walletBalance += amount;
    const nextBalance = customerRecord ? customerRecord.walletBalance : dbStore.walletBalance;

    const refundTx: WalletTransaction & { customerId?: string } = {
      id: 'tx-' + Date.now(),
      customerId: body.customerId,
      referenceNumber: 'WRF-' + Date.now().toString().slice(-8),
      type: 'CREDIT',
      amount,
      category: 'REFUND',
      status: 'COMPLETED',
      orderId: body.orderId,
      description: `Refund credited for Order #${body.orderId} (${body.reason || 'Material Return / Surplus'})`,
      createdAt: new Date().toISOString(),
      balanceAfter: nextBalance,
    };

    dbStore.walletTransactions.unshift(refundTx);
    await platformPersistenceService.upsert(PlatformWalletTxnModel, refundTx);

    return {
      success: true,
      message: `Refund of ₹${amount} credited to your wallet`,
      data: {
        transaction: refundTx,
        newBalance: nextBalance,
      },
    };
  }
}
