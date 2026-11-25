import { Logger } from '@nestjs/common';
import mongoose, { Schema, Model } from 'mongoose';

const CompanyTenantSchema = new Schema(
  { id: { type: String, required: true, unique: true } },
  { collection: 'company_tenants', strict: false }
);
const CompanyAdminUserSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_admin_users', strict: false }
);
const CompanyQuotationSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_quotations', strict: false }
);
const CompanyContentSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_content_items', strict: false }
);
const CompanyAuditLogSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_audit_logs', strict: false }
);
const CompanyDeliveryPartnerSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_delivery_partners', strict: false }
);
const CompanyCustomerSchema = new Schema(
  { id: { type: String, required: true, unique: true }, tenantId: { type: String, index: true } },
  { collection: 'company_customers', strict: false }
);

export const CompanyTenantModel: Model<any> =
  mongoose.models.CompanyTenant || mongoose.model('CompanyTenant', CompanyTenantSchema);
export const CompanyAdminUserModel: Model<any> =
  mongoose.models.CompanyAdminUser || mongoose.model('CompanyAdminUser', CompanyAdminUserSchema);
export const CompanyQuotationModel: Model<any> =
  mongoose.models.CompanyQuotation || mongoose.model('CompanyQuotation', CompanyQuotationSchema);
export const CompanyContentModel: Model<any> =
  mongoose.models.CompanyContent || mongoose.model('CompanyContent', CompanyContentSchema);
export const CompanyAuditLogModel: Model<any> =
  mongoose.models.CompanyAuditLog || mongoose.model('CompanyAuditLog', CompanyAuditLogSchema);
export const CompanyDeliveryPartnerModel: Model<any> =
  mongoose.models.CompanyDeliveryPartner ||
  mongoose.model('CompanyDeliveryPartner', CompanyDeliveryPartnerSchema);
export const CompanyCustomerModel: Model<any> =
  mongoose.models.CompanyCustomer || mongoose.model('CompanyCustomer', CompanyCustomerSchema);

class CompanyAdminPersistenceService {
  private readonly logger = new Logger(CompanyAdminPersistenceService.name);

  isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async upsert(model: Model<any>, record: any): Promise<void> {
    if (!this.isDbConnected() || !record?.id) return;
    try {
      const clean = { ...record };
      delete clean._id;
      delete clean.__v;
      await model
        .findOneAndUpdate({ id: record.id }, { $set: clean }, { upsert: true, new: true })
        .exec();
    } catch (err: any) {
      this.logger.warn(`MongoDB upsert failed (${model.modelName}): ${err.message}`);
    }
  }

  async loadCollection<T>(model: Model<any>): Promise<T[]> {
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
      this.logger.warn(`MongoDB loadCollection failed (${model.modelName}): ${err.message}`);
      return [];
    }
  }
}

export const companyAdminPersistenceService = new CompanyAdminPersistenceService();
