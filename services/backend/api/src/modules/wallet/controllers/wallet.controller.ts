import { Controller, Get, Post, Body, Query, BadRequestException, Headers } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { WalletTransaction } from '@buildora/types';
import { requireCustomer } from '../../../common/customer-auth.util';
import {
  PlatformWalletTxnModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';

@Controller('api/v1/wallet')
export class WalletController {
  @Get()
  getWalletSummary(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const customerRecord = companyAdminDataService.customers.get(cust.sub) as any;
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    const balance = customerRecord ? Number(customerRecord.walletBalance ?? 0) : (isSeedDemo ? dbStore.walletBalance : 0);

    return {
      success: true,
      data: {
        currentBalance: balance,
        availableBalance: balance,
        pendingBalance: isSeedDemo ? dbStore.pendingWalletBalance : 0,
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
    const cust = requireCustomer(authHeader);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    let result = [...dbStore.walletTransactions].filter((tx: any) =>
      tx.customerId ? tx.customerId === cust.sub : isSeedDemo
    );

    if (type) {
      result = result.filter((tx) => tx.type === type);
    }
    if (category && category !== 'ALL') {
      result = result.filter((tx) => tx.category === category);
    }

    const customerRecord = companyAdminDataService.customers.get(cust.sub) as any;
    const balance = customerRecord ? Number(customerRecord.walletBalance ?? 0) : (isSeedDemo ? dbStore.walletBalance : 0);

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
    const cust = requireCustomer(authHeader);
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    const customerRecord = companyAdminDataService.customers.get(cust.sub) as any;
    let nextBalance = 0;
    if (customerRecord) {
      customerRecord.walletBalance = Number(customerRecord.walletBalance || 0) + amount;
      nextBalance = customerRecord.walletBalance;
    } else {
      dbStore.walletBalance += amount;
      nextBalance = dbStore.walletBalance;
    }

    const newTx: WalletTransaction & { customerId?: string } = {
      id: 'tx-' + Date.now(),
      customerId: cust.sub,
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
    @Body() body: { orderId: string; amount: number; reason?: string; customerId?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    const targetCustomerId = cust.sub;
    const customerRecord = companyAdminDataService.customers.get(targetCustomerId) as any;
    let nextBalance = 0;
    if (customerRecord) {
      customerRecord.walletBalance = Number(customerRecord.walletBalance || 0) + amount;
      nextBalance = customerRecord.walletBalance;
    } else {
      dbStore.walletBalance += amount;
      nextBalance = dbStore.walletBalance;
    }

    const refundTx: WalletTransaction & { customerId?: string } = {
      id: 'tx-' + Date.now(),
      customerId: targetCustomerId,
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
