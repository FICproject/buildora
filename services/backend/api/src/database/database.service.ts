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
  private databaseName: string = 'buildora60';

  constructor() {
    // Check initial environment
    const rawUri = process.env.MONGODB_URI;
    if (rawUri && rawUri.includes('YOUR_PASSWORD')) {
      this.status = 'BLOCKED_CREDENTIALS_NEEDED';
      this.errorMessage = 'Placeholder password "YOUR_PASSWORD" detected in MONGODB_URI. Real credentials required.';
    }
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect() {
    const rawUri = process.env.MONGODB_URI;

    if (!rawUri) {
      this.status = 'DISCONNECTED';
      this.errorMessage = 'MONGODB_URI environment variable is not defined.';
      this.logger.warn('MongoDB URI not configured. Running with in-memory persistence layer.');
      return;
    }

    if (rawUri.includes('YOUR_PASSWORD')) {
      this.status = 'BLOCKED_CREDENTIALS_NEEDED';
      this.errorMessage = 'Placeholder password "YOUR_PASSWORD" detected in MONGODB_URI. Real credentials required.';
      this.logger.warn('MongoDB URI contains placeholder "YOUR_PASSWORD". Database connection blocked pending real credentials.');
      return;
    }

    try {
      this.status = 'CONNECTING';
      this.logger.log('Connecting to MongoDB database...');

      await mongoose.connect(rawUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      this.status = 'CONNECTED';
      this.errorMessage = null;
      this.databaseName = mongoose.connection.name || 'buildora60';
      this.logger.log(`MongoDB connected successfully to database: ${this.databaseName}`);
    } catch (err: any) {
      this.status = 'UNREACHABLE';
      this.errorMessage = err.message || 'Failed to connect to MongoDB';
      this.logger.error(`MongoDB connection failed: ${this.errorMessage}`);
      this.logger.warn('Backend operating gracefully with memory-persisted store fallback.');
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
