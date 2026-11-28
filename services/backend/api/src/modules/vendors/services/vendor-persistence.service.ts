import { Logger } from '@nestjs/common';
import mongoose, { Schema, Model } from 'mongoose';

const VendorMongoSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    applicationId: { type: String, index: true },
    storeName: { type: String },
    name: { type: String },
    email: { type: String, index: true },
    phone: { type: String, index: true },
    logoUrl: { type: String },
    logoMetadata: { type: Schema.Types.Mixed },
    passwordHash: { type: String },
    refreshToken: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Number, default: 0 },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    registrationStep: { type: Number, default: 1 },
    submittedAt: { type: String, index: true },
    latestKycSubmittedAt: { type: String, index: true },
    lastDocumentUploadedAt: { type: String, index: true },
    resubmittedAt: { type: String },
    aadhaarNumber: { type: String, index: true },
    aadhaarMasked: { type: String },
    panMasked: { type: String },
    gstStatus: { type: String, index: true },
    gstApplicationNumber: { type: String },
    msmeStatus: { type: String, index: true },
    udyamNumber: { type: String },
    msmeApplicationNumber: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: String },
    rejectedBy: { type: String },
    rejectedAt: { type: String },
    rejectionReason: { type: String },
    resubmissionReason: { type: String },
    suspendedReason: { type: String },
    suspendedAt: { type: String },
    rating: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    categories: [{ type: String }],
    businessInfo: { type: Schema.Types.Mixed },
    warehouses: [{ type: Schema.Types.Mixed }],
    kycDocuments: [{ type: Schema.Types.Mixed }],
    auditLogs: [{ type: Schema.Types.Mixed }],
    registrationData: { type: Schema.Types.Mixed },
    createdAt: { type: String, index: true },
    updatedAt: { type: String, index: true }
  },
  {
    collection: 'vendors',
    strict: false,
    timestamps: false
  }
);

VendorMongoSchema.index({ tenantId: 1, status: 1, latestKycSubmittedAt: -1 });
VendorMongoSchema.index({ tenantId: 1, updatedAt: -1 });
VendorMongoSchema.index({ 'businessInfo.gstin': 1 });
VendorMongoSchema.index({ 'businessInfo.pan': 1 });
VendorMongoSchema.index({ 'businessInfo.address.city': 1, 'businessInfo.address.state': 1, 'businessInfo.address.pincode': 1 });

export const VendorMongoModel: Model<any> =
  mongoose.models.Vendor || mongoose.model('Vendor', VendorMongoSchema);

class VendorPersistenceService {
  private readonly logger = new Logger(VendorPersistenceService.name);

  isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Persists a vendor record to MongoDB atomically using upsert.
   * Safe to call even if MongoDB is disconnected (gracefully no-ops so in-memory fallback stays active).
   */
  async saveVendorRecord(record: any): Promise<void> {
    if (!this.isDbConnected() || !record?.id) return;
    try {
      const sanitized = { ...record };
      delete sanitized._id;
      delete sanitized.__v;
      await VendorMongoModel.findOneAndUpdate(
        { id: record.id },
        { $set: sanitized },
        { upsert: true, new: true }
      ).exec();
    } catch (err: any) {
      this.logger.warn(`MongoDB saveVendorRecord failed for ${record.id}: ${err.message}`);
    }
  }

  /**
   * Loads all persisted vendor records from MongoDB into the in-memory map on startup.
   */
  async loadAllVendorsIntoMap(targetMap: Map<string, any>): Promise<number> {
    if (!this.isDbConnected()) return 0;
    try {
      const docs = await VendorMongoModel.find({}).lean().exec();
      let count = 0;
      for (const doc of docs) {
        if (doc?.id) {
          const clean = { ...doc };
          delete (clean as any)._id;
          delete (clean as any).__v;
          targetMap.set(doc.id, clean);
          count++;
        }
      }
      this.logger.log(`Hydrated ${count} vendor records from MongoDB.`);
      return count;
    } catch (err: any) {
      this.logger.warn(`MongoDB loadAllVendorsIntoMap failed: ${err.message}`);
      return 0;
    }
  }

  /**
   * Loads a single vendor record by ID directly from MongoDB and hydrates the in-memory map if found.
   */
  async loadVendorById(vendorId: string, targetMap?: Map<string, any>): Promise<any | null> {
    if (!this.isDbConnected() || !vendorId) return null;
    try {
      const doc = await VendorMongoModel.findOne({ id: vendorId }).lean().exec();
      if (!doc) return null;
      const clean = { ...doc };
      delete (clean as any)._id;
      delete (clean as any).__v;
      if (targetMap && clean.id) {
        targetMap.set(clean.id, clean);
      }
      return clean;
    } catch (err: any) {
      this.logger.warn(`MongoDB loadVendorById failed for ${vendorId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Finds a vendor record by email or 10-digit mobile directly from MongoDB (case-insensitive)
   * and hydrates the in-memory map if found.
   */
  async loadVendorByIdentifier(identifier: string, targetMap?: Map<string, any>): Promise<any | null> {
    if (!this.isDbConnected() || !identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '').slice(-10);
    try {
      const escapedEmail = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');
      const orClauses: any[] = [
        { email: emailRegex },
        { 'businessInfo.email': emailRegex },
      ];
      if (digitsOnly.length === 10) {
        const phoneRegex = new RegExp(`${digitsOnly}$`);
        orClauses.push({ phone: phoneRegex }, { 'businessInfo.phone': phoneRegex });
      }
      const doc = await VendorMongoModel.findOne({ $or: orClauses }).lean().exec();
      if (!doc) return null;
      const cleanDoc = { ...doc };
      delete (cleanDoc as any)._id;
      delete (cleanDoc as any).__v;
      if (targetMap && cleanDoc.id) {
        targetMap.set(cleanDoc.id, cleanDoc);
      }
      return cleanDoc;
    } catch (err: any) {
      this.logger.warn(`MongoDB loadVendorByIdentifier failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Finds a vendor record by persisted refresh token.
   */
  async loadVendorByRefreshToken(refreshToken: string, targetMap?: Map<string, any>): Promise<any | null> {
    if (!this.isDbConnected() || !refreshToken) return null;
    try {
      const doc = await VendorMongoModel.findOne({ refreshToken }).lean().exec();
      if (!doc) return null;
      const clean = { ...doc };
      delete (clean as any)._id;
      delete (clean as any).__v;
      if (targetMap && clean.id) {
        targetMap.set(clean.id, clean);
      }
      return clean;
    } catch (err: any) {
      this.logger.warn(`MongoDB loadVendorByRefreshToken failed: ${err.message}`);
      return null;
    }
  }
}

export const vendorPersistenceService = new VendorPersistenceService();
