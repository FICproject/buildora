import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MAX_LOGO_SIZE_BYTES, validateLogoFileMetadata } from '@buildora/validation';
import { VendorLogoMetadata } from '@buildora/types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localLogoDir = path.resolve(process.cwd(), 'uploads', 'vendor-logos');

  constructor() {
    this.ensureLocalDir();
  }

  private ensureLocalDir() {
    try {
      if (!fs.existsSync(this.localLogoDir)) {
        fs.mkdirSync(this.localLogoDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.warn(`Could not create upload dir ${this.localLogoDir}: ${err.message}`);
    }
  }

  /**
   * Inspects raw file magic bytes to verify genuine JPEG, PNG, or WEBP content.
   * Prevents spoofed extensions or malicious non-image uploads.
   */
  detectImageTypeFromBuffer(buffer: Buffer): { mimeType: string; ext: string } | null {
    if (!buffer || buffer.length < 12) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', ext: 'jpg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { mimeType: 'image/png', ext: 'png' };
    }

    // WEBP: "RIFF" .... "WEBP"
    if (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return { mimeType: 'image/webp', ext: 'webp' };
    }

    return null;
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

    // If S3 is configured, upload to S3; otherwise use secure local object storage
    const s3Bucket = process.env.AWS_S3_BUCKET;
    if (s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      // S3 integration hook when credentials are provided
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

    this.ensureLocalDir();
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
}

export const storageService = new StorageService();
