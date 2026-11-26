import { Logger } from '@nestjs/common';
import mongoose, { Model, Schema } from 'mongoose';

const PlatformProductSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true } },
  { collection: 'platform_products', strict: false }
);
const PlatformOrderSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, orderNumber: { type: String, index: true } },
  { collection: 'platform_orders', strict: false }
);
const PlatformReturnSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, orderId: { type: String, index: true } },
  { collection: 'platform_returns', strict: false }
);
const PlatformNotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipientRole: { type: String, index: true },
    recipientId: { type: String, index: true },
    tenantId: { type: String, index: true },
  },
  { collection: 'platform_notifications', strict: false }
);
const PlatformNotificationPrefSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true } },
  { collection: 'platform_notification_prefs', strict: false }
);
const PlatformSupportTicketSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true } },
  { collection: 'platform_support_tickets', strict: false }
);
const PlatformReviewSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, productId: { type: String, index: true } },
  { collection: 'platform_reviews', strict: false }
);
const PlatformSettlementSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, vendorId: { type: String, index: true } },
  { collection: 'platform_settlements', strict: false }
);
const PlatformStockMovementSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, productId: { type: String, index: true } },
  { collection: 'platform_stock_movements', strict: false }
);
const PlatformWarehouseSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, vendorId: { type: String, index: true } },
  { collection: 'platform_warehouses', strict: false }
);
const PlatformWalletTxnSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, customerId: { type: String, index: true } },
  { collection: 'platform_wallet_txns', strict: false }
);

export const PlatformProductModel: Model<any> =
  mongoose.models.PlatformProduct || mongoose.model('PlatformProduct', PlatformProductSchema);
export const PlatformOrderModel: Model<any> =
  mongoose.models.PlatformOrder || mongoose.model('PlatformOrder', PlatformOrderSchema);
export const PlatformReturnModel: Model<any> =
  mongoose.models.PlatformReturn || mongoose.model('PlatformReturn', PlatformReturnSchema);
export const PlatformNotificationModel: Model<any> =
  mongoose.models.PlatformNotification ||
  mongoose.model('PlatformNotification', PlatformNotificationSchema);
export const PlatformNotificationPrefModel: Model<any> =
  mongoose.models.PlatformNotificationPref ||
  mongoose.model('PlatformNotificationPref', PlatformNotificationPrefSchema);
export const PlatformSupportTicketModel: Model<any> =
  mongoose.models.PlatformSupportTicket ||
  mongoose.model('PlatformSupportTicket', PlatformSupportTicketSchema);
export const PlatformReviewModel: Model<any> =
  mongoose.models.PlatformReview || mongoose.model('PlatformReview', PlatformReviewSchema);
export const PlatformSettlementModel: Model<any> =
  mongoose.models.PlatformSettlement ||
  mongoose.model('PlatformSettlement', PlatformSettlementSchema);
export const PlatformStockMovementModel: Model<any> =
  mongoose.models.PlatformStockMovement ||
  mongoose.model('PlatformStockMovement', PlatformStockMovementSchema);
export const PlatformWarehouseModel: Model<any> =
  mongoose.models.PlatformWarehouse || mongoose.model('PlatformWarehouse', PlatformWarehouseSchema);
export const PlatformWalletTxnModel: Model<any> =
  mongoose.models.PlatformWalletTxn || mongoose.model('PlatformWalletTxn', PlatformWalletTxnSchema);

class PlatformPersistenceService {
  private readonly logger = new Logger(PlatformPersistenceService.name);

  isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async upsert(model: Model<any>, record: any, idField = 'id'): Promise<void> {
    if (!this.isDbConnected() || !record || !record[idField]) return;
    try {
      const clean = { ...record };
      delete clean._id;
      delete clean.__v;
      await model
        .findOneAndUpdate({ [idField]: record[idField] }, { $set: clean }, { upsert: true, new: true })
        .exec();
    } catch (err: any) {
      this.logger.warn(`MongoDB upsert failed (${model.modelName}): ${err.message}`);
    }
  }

  async remove(model: Model<any>, idValue: string, idField = 'id'): Promise<void> {
    if (!this.isDbConnected() || !idValue) return;
    try {
      await model.deleteOne({ [idField]: idValue }).exec();
    } catch (err: any) {
      this.logger.warn(`MongoDB remove failed (${model.modelName}): ${err.message}`);
    }
  }

  async loadAll<T>(model: Model<any>): Promise<T[]> {
    if (!this.isDbConnected()) return [];
    try {
      const docs = await model.find({}).lean().exec();
      return docs.map((d: any) => {
        const clean = { ...d };
        delete clean._id;
        delete clean.__v;
        return clean as T;
      });
    } catch (err: any) {
      this.logger.warn(`MongoDB loadAll failed (${model.modelName}): ${err.message}`);
      return [];
    }
  }
}

export const platformPersistenceService = new PlatformPersistenceService();
