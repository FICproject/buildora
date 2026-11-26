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
const MainCategorySchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'main_categories', strict: false }
);
const ChildCategorySchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, mainCategoryId: { type: String, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'child_categories', strict: false }
);
const ProductTypeSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, mainCategoryId: { type: String, index: true }, childCategoryId: { type: String, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'product_types', strict: false }
);
const NewLaunchCollectionSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'new_launch_collections', strict: false }
);
const CategoryFieldSchemaDef = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    childCategoryId: { type: String, index: true },
    childCategorySlug: { type: String, index: true },
    fieldKey: { type: String, index: true },
    tenantId: { type: String, index: true },
  },
  { collection: 'category_field_schemas', strict: false }
);
const DesktopNavItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, index: true },
    tenantId: { type: String, index: true },
  },
  { collection: 'desktop_navigation_items', strict: false }
);
const CatalogPublishSnapshotSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, index: true },
  },
  { collection: 'catalog_publish_snapshots', strict: false }
);
const CatalogBrandSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'catalog_brands', strict: false }
);
const CatalogAttributeSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'catalog_attributes', strict: false }
);
const PlatformCouponSchema = new Schema(
  { code: { type: String, required: true, unique: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'platform_coupons', strict: false }
);
const PlatformPromotionSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, vendorId: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'platform_promotions', strict: false }
);
const KnowledgeArticleSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, slug: { type: String, index: true }, tenantId: { type: String, index: true } },
  { collection: 'knowledge_articles', strict: false }
);
const FaqItemSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'faq_items', strict: false }
);
const ServiceableZoneSchema = new Schema(
  { pincode: { type: String, required: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'serviceable_zones', strict: false }
);
const NotificationTemplateSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'notification_templates', strict: false }
);
const DispatchAssignmentSchema = new Schema(
  { orderId: { type: String, required: true, unique: true, index: true }, tenantId: { type: String, index: true } },
  { collection: 'dispatch_assignments', strict: false }
);
const VendorInvoiceSchema = new Schema(
  { id: { type: String, required: true, unique: true, index: true }, vendorId: { type: String, index: true } },
  { collection: 'vendor_invoices', strict: false }
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
export const MainCategoryModel: Model<any> =
  mongoose.models.MainCategory || mongoose.model('MainCategory', MainCategorySchema);
export const ChildCategoryModel: Model<any> =
  mongoose.models.ChildCategory || mongoose.model('ChildCategory', ChildCategorySchema);
export const ProductTypeModel: Model<any> =
  mongoose.models.ProductType || mongoose.model('ProductType', ProductTypeSchema);
export const NewLaunchCollectionModel: Model<any> =
  mongoose.models.NewLaunchCollection || mongoose.model('NewLaunchCollection', NewLaunchCollectionSchema);
export const CategoryFieldSchemaModel: Model<any> =
  mongoose.models.CategoryFieldSchema || mongoose.model('CategoryFieldSchema', CategoryFieldSchemaDef);
export const DesktopNavItemModel: Model<any> =
  mongoose.models.DesktopNavItem || mongoose.model('DesktopNavItem', DesktopNavItemSchema);
export const CatalogPublishSnapshotModel: Model<any> =
  mongoose.models.CatalogPublishSnapshot || mongoose.model('CatalogPublishSnapshot', CatalogPublishSnapshotSchema);
export const CatalogBrandModel: Model<any> =
  mongoose.models.CatalogBrand || mongoose.model('CatalogBrand', CatalogBrandSchema);
export const CatalogAttributeModel: Model<any> =
  mongoose.models.CatalogAttribute || mongoose.model('CatalogAttribute', CatalogAttributeSchema);
export const PlatformCouponModel: Model<any> =
  mongoose.models.PlatformCoupon || mongoose.model('PlatformCoupon', PlatformCouponSchema);
export const PlatformPromotionModel: Model<any> =
  mongoose.models.PlatformPromotion || mongoose.model('PlatformPromotion', PlatformPromotionSchema);
export const KnowledgeArticleModel: Model<any> =
  mongoose.models.KnowledgeArticle || mongoose.model('KnowledgeArticle', KnowledgeArticleSchema);
export const FaqModel: Model<any> =
  mongoose.models.FaqItem || mongoose.model('FaqItem', FaqItemSchema);
export const ServiceableZoneModel: Model<any> =
  mongoose.models.ServiceableZone || mongoose.model('ServiceableZone', ServiceableZoneSchema);
export const NotificationTemplateModel: Model<any> =
  mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', NotificationTemplateSchema);
export const DispatchAssignmentModel: Model<any> =
  mongoose.models.DispatchAssignment || mongoose.model('DispatchAssignment', DispatchAssignmentSchema);
export const VendorInvoiceModel: Model<any> =
  mongoose.models.VendorInvoice || mongoose.model('VendorInvoice', VendorInvoiceSchema);

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
