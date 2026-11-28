import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  MAX_LOGO_SIZE_BYTES,
  MAX_KYC_DOC_SIZE_BYTES,
  ALLOWED_KYC_DOCUMENT_TYPES,
  validateLogoFileMetadata,
  validateKycDocumentMetadata,
  detectImageSignature,
  detectKycDocumentSignature
} from '@buildora/validation';
import { VendorLogoMetadata, VendorKycDocument } from '@buildora/types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localLogoDir = path.resolve(process.cwd(), 'uploads', 'vendor-logos');
  private readonly localDocDir = path.resolve(process.cwd(), 'uploads', 'vendor-docs');

  constructor() {
    this.ensureLocalDirs();
  }

  private ensureLocalDirs() {
    for (const dir of [this.localLogoDir, this.localDocDir]) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (err: any) {
        this.logger.warn(`Could not create upload dir ${dir}: ${err.message}`);
      }
    }
  }

  /**
   * Inspects raw file magic bytes to verify genuine JPEG, PNG, or WEBP content.
   * Prevents spoofed extensions or malicious non-image uploads.
   */
  detectImageTypeFromBuffer(buffer: Buffer): { mimeType: string; ext: string } | null {
    return detectImageSignature(buffer);
  }

  /**
   * Validates and stores an uploaded vendor business logo.
   * Never stores image binaries in MongoDB; stores only in object storage and returns URL + metadata.
   */
  async uploadVendorLogo(
    buffer: Buffer,
    originalName: string,
    reportedMimeType: string,
    baseUrl?: string
  ): Promise<VendorLogoMetadata> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded logo file is empty.');
    }

    if (buffer.length > MAX_LOGO_SIZE_BYTES) {
      throw new BadRequestException('Business logo file size must not exceed 5 MB.');
    }

    const metaCheck = validateLogoFileMetadata(reportedMimeType, buffer.length, originalName);
    if (!metaCheck.isValid) {
      throw new BadRequestException(metaCheck.error);
    }

    // Verify actual binary magic bytes
    const detected = this.detectImageTypeFromBuffer(buffer);
    if (!detected) {
      throw new BadRequestException(
        'Invalid image file content. File signature does not match genuine JPG, PNG, or WEBP.'
      );
    }

    const safeFileName = `vendor-logo-${crypto.randomUUID()}.${detected.ext}`;
    const uploadedAt = new Date().toISOString();

    const s3Bucket = process.env.AWS_S3_BUCKET;
    if (s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const region = process.env.AWS_REGION || 'ap-south-1';
      const url = `https://${s3Bucket}.s3.${region}.amazonaws.com/vendor-logos/${safeFileName}`;
      return {
        url,
        fileName: safeFileName,
        mimeType: detected.mimeType,
        fileSize: buffer.length,
        uploadedAt,
        storageProvider: 'S3'
      };
    }

    this.ensureLocalDirs();
    const targetPath = path.join(this.localLogoDir, safeFileName);
    await fs.promises.writeFile(targetPath, buffer);

    const origin = baseUrl || `http://localhost:${process.env.PORT || 3000}`;
    return {
      url: `${origin}/api/v1/vendor/uploads/logos/${safeFileName}`,
      fileName: safeFileName,
      mimeType: detected.mimeType,
      fileSize: buffer.length,
      uploadedAt,
      storageProvider: 'LOCAL_OBJECT_STORAGE'
    };
  }

  /**
   * Validates actual magic bytes and stores an uploaded KYC document (PDF, JPG, PNG <= 5 MB).
   */
  async uploadKycDocument(
    buffer: Buffer,
    originalName: string,
    reportedMimeType: string,
    docType: VendorKycDocument['type'],
    title: string,
    baseUrl?: string
  ): Promise<VendorKycDocument> {
    if (!docType || !ALLOWED_KYC_DOCUMENT_TYPES.includes(docType as any)) {
      throw new BadRequestException('Invalid KYC document type.');
    }
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded document file is empty.');
    }
    if (buffer.length > MAX_KYC_DOC_SIZE_BYTES) {
      throw new BadRequestException('KYC document file size must not exceed 5 MB.');
    }

    const metaCheck = validateKycDocumentMetadata(reportedMimeType, buffer.length, originalName);
    if (!metaCheck.isValid) {
      throw new BadRequestException(metaCheck.error);
    }

    const detected = detectKycDocumentSignature(buffer);
    if (!detected) {
      throw new BadRequestException(
        'Corrupted or unsupported document file. File signature must be genuine PDF, JPG, JPEG, PNG, or WEBP.'
      );
    }

    const safeFileName = `vendor-doc-${crypto.randomUUID()}.${detected.ext}`;
    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const uploadedAt = new Date().toISOString();

    this.ensureLocalDirs();
    const targetPath = path.join(this.localDocDir, safeFileName);
    await fs.promises.writeFile(targetPath, buffer);

    const origin = baseUrl || `http://localhost:${process.env.PORT || 3000}`;
    return {
      id: docId,
      type: docType,
      title: title || originalName,
      fileName: originalName,
      fileSize: buffer.length,
      mimeType: detected.mimeType,
      fileUrl: `${origin}/api/v1/vendor/uploads/docs/${safeFileName}`,
      storageKey: safeFileName,
      storageProvider: 'LOCAL_OBJECT_STORAGE',
      uploadedAt,
      verificationStatus: 'PENDING'
    };
  }

  /**
   * Safely retrieves a stored vendor logo file while preventing path traversal.
   */
  getLogoFilePath(filename: string): { filePath: string; mimeType: string } {
    const cleanName = path.basename(filename || '');
    if (!cleanName || !/^vendor-logo-[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(cleanName)) {
      throw new NotFoundException('Requested logo file not found.');
    }

    const filePath = path.join(this.localLogoDir, cleanName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Logo file does not exist in storage.');
    }

    const ext = path.extname(cleanName).toLowerCase();
    const mimeType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    return { filePath, mimeType };
  }

  /**
   * Safely retrieves a stored vendor KYC document while preventing path traversal.
   */
  getDocumentFilePath(filename: string): { filePath: string; mimeType: string; fileSize: number } {
    const cleanName = path.basename(String(filename || '').split('?')[0]);
    if (!cleanName || !/^vendor-doc-[a-f0-9-]+\.(pdf|jpg|jpeg|png|webp)$/i.test(cleanName)) {
      throw new NotFoundException('Requested document file not found.');
    }

    const filePath = path.join(this.localDocDir, cleanName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Document file does not exist in storage.');
    }

    const stat = fs.statSync(filePath);
    if (stat.size <= 0) {
      throw new BadRequestException('Stored document file is empty or incomplete.');
    }

    const ext = path.extname(cleanName).toLowerCase();
    const mimeType =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg';

    return { filePath, mimeType, fileSize: stat.size };
  }

  /**
   * Extracts storage key from a VendorKycDocument record and verifies file existence & integrity.
   */
  resolveDocumentFile(doc: any): {
    storageKey: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    originalFileName: string;
  } {
    const rawKey =
      doc?.storageKey ||
      (typeof doc?.fileUrl === 'string' && doc.fileUrl.includes('/uploads/docs/')
        ? doc.fileUrl.split('/uploads/docs/')[1]?.split('?')[0]
        : typeof doc?.url === 'string' && doc.url.includes('/uploads/docs/')
          ? doc.url.split('/uploads/docs/')[1]?.split('?')[0]
          : '');
    if (!rawKey) {
      throw new NotFoundException(
        'Uploaded binary file is unavailable in storage for this document record.'
      );
    }
    const { filePath, mimeType, fileSize } = this.getDocumentFilePath(rawKey);
    return {
      storageKey: path.basename(rawKey),
      filePath,
      mimeType,
      fileSize,
      originalFileName: String(doc?.fileName || path.basename(rawKey)),
    };
  }
}

export const storageService = new StorageService();
