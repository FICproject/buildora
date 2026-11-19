import { Controller, Get, Param, Headers } from '@nestjs/common';
import { databaseService, DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  private readonly dbService: DatabaseService = databaseService;

  @Get('api/health')
  getHealthRoot(@Headers('x-tenant-id') tenantId?: string) {
    return this.generateHealthResponse(tenantId);
  }

  @Get('api/v1/health')
  getHealthV1(@Headers('x-tenant-id') tenantId?: string) {
    return this.generateHealthResponse(tenantId);
  }

  private generateHealthResponse(tenantId?: string) {
    const dbStatus = this.dbService.getStatus();

    return {
      status: 'UP',
      platform: 'BUILDORA 60',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      version: '1.0.0',
      tenantId: tenantId || 'tenant-buildora-blr',
      database: {
        status: dbStatus.status,
        driver: 'mongoose',
        databaseName: dbStatus.databaseName,
        uriConfigured: dbStatus.uriConfigured,
        hasPlaceholderCredentials: dbStatus.hasPlaceholderCredentials,
        fallbackMode: dbStatus.fallbackMode,
        note: dbStatus.hasPlaceholderCredentials
          ? 'MongoDB URI is configured with placeholder credentials. Replace YOUR_PASSWORD in .env with real credentials.'
          : dbStatus.status === 'CONNECTED'
          ? 'MongoDB connected and operational.'
          : 'Operating in memory-persisted fallback mode.'
      },
      warehouseStatus: {
        'WH-BLR-01': 'ONLINE',
        'WH-BLR-02': 'ONLINE'
      },
      services: {
        catalogue: 'HEALTHY',
        products: 'HEALTHY',
        cart: 'HEALTHY',
        orders: 'HEALTHY',
        wallet: 'HEALTHY',
        auth: 'HEALTHY'
      }
    };
  }

  @Get('api/v1/tenants')
  getTenants() {
    return {
      success: true,
      data: [
        {
          id: 'tenant-buildora-blr',
          name: 'BUILDORA 60 Bengaluru',
          slug: 'buildora',
          tagline: 'BUILD SMART. DELIVER FAST.',
          currency: 'INR',
          isWhiteLabel: false,
          activeWarehouses: ['WH-BLR-01', 'WH-BLR-02']
        }
      ]
    };
  }

  @Get('api/v1/tenants/:slug')
  getTenantBySlug(@Param('slug') slug: string) {
    return {
      success: true,
      data: {
        id: 'tenant-buildora-blr',
        name: 'BUILDORA 60 Bengaluru',
        slug,
        tagline: 'BUILD SMART. DELIVER FAST.',
        currency: 'INR',
        primaryColor: '#1E3A8A',
        secondaryColor: '#EA580C',
        features: [
          'quick_commerce_60m',
          'bulk_orders',
          'material_estimator',
          'b2b_gst_invoicing',
          'contractor_wallet'
        ]
      }
    };
  }
}
