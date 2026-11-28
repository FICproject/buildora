import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import mongoose from 'mongoose';

export type DbConnectionStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'BLOCKED_CREDENTIALS_NEEDED'
  | 'UNREACHABLE';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private status: DbConnectionStatus = 'DISCONNECTED';
  private errorMessage: string | null = null;
  private databaseName: string = process.env.MONGODB_DATABASE || 'buildora60';
  private connectPromise: Promise<DbConnectionStatus> | null = null;

  constructor() {
    const rawUri = process.env.MONGODB_URI;
    if (rawUri && rawUri.includes('YOUR_PASSWORD')) {
      this.status = 'BLOCKED_CREDENTIALS_NEEDED';
      this.errorMessage = 'Placeholder password "YOUR_PASSWORD" detected in MONGODB_URI. Real credentials required.';
    }
  }

  async onModuleInit() {
    await this.ensureConnected();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async ensureConnected(): Promise<DbConnectionStatus> {
    if (this.status === 'CONNECTED' && mongoose.connection.readyState === 1) {
      return this.status;
    }
    if (!this.connectPromise) {
      this.connectPromise = this.connect().finally(() => {
        this.connectPromise = null;
      });
    }
    return this.connectPromise;
  }

  isConfiguredAndUnreachable(): boolean {
    const rawUri = process.env.MONGODB_URI;
    if (!rawUri || rawUri.includes('YOUR_PASSWORD')) return false;
    return this.status !== 'CONNECTED' || mongoose.connection.readyState !== 1;
  }

  async connect(): Promise<DbConnectionStatus> {
    const rawUri = process.env.MONGODB_URI;

    if (!rawUri) {
      this.status = 'DISCONNECTED';
      this.errorMessage = 'MONGODB_URI environment variable is not defined.';
      this.logger.warn('MongoDB URI not configured. Running with in-memory persistence layer.');
      return this.status;
    }

    if (rawUri.includes('YOUR_PASSWORD')) {
      this.status = 'BLOCKED_CREDENTIALS_NEEDED';
      this.errorMessage = 'Placeholder password "YOUR_PASSWORD" detected in MONGODB_URI. Real credentials required.';
      this.logger.warn('MongoDB URI contains placeholder "YOUR_PASSWORD". Database connection blocked pending real credentials.');
      return this.status;
    }

    try {
      this.status = 'CONNECTING';
      this.logger.log('Connecting to MongoDB database...');
      const configuredDb = (process.env.MONGODB_DATABASE || 'buildora60').trim();

      await mongoose.connect(rawUri, {
        dbName: configuredDb || 'buildora60',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      this.status = 'CONNECTED';
      this.errorMessage = null;
      this.databaseName = mongoose.connection.name || configuredDb || 'buildora60';
      this.logger.log(`MongoDB connected successfully to database: ${this.databaseName}`);
      return this.status;
    } catch (err: any) {
      this.status = 'UNREACHABLE';
      this.errorMessage = err.message || 'Failed to connect to MongoDB';
      this.logger.error(`MongoDB connection failed: ${this.errorMessage}`);
      this.logger.warn('Backend operating gracefully with memory-persisted store fallback.');
      return this.status;
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this.status = 'DISCONNECTED';
      this.logger.log('MongoDB disconnected.');
    }
  }

  getStatus() {
    const rawUri = process.env.MONGODB_URI;
    const hasPlaceholder = rawUri ? rawUri.includes('YOUR_PASSWORD') : false;

    return {
      status: this.status,
      readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      databaseName: this.databaseName,
      uriConfigured: Boolean(rawUri),
      hasPlaceholderCredentials: hasPlaceholder,
      error: this.errorMessage,
      fallbackMode: this.status !== 'CONNECTED' ? 'IN_MEMORY_PERSISTED' : 'MONGODB_ATLAS'
    };
  }
}

export const databaseService = new DatabaseService();
