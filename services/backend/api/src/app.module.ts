import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseService, databaseService } from './database/database.service';
import { TaxonomyService, taxonomyService } from './modules/catalogue/services/taxonomy.service';
import { AuthController } from './modules/auth/controllers/auth.controller';
import { CatalogueController } from './modules/catalogue/controllers/catalogue.controller';
import { ProductsController } from './modules/products/controllers/products.controller';
import { ReviewsController } from './modules/products/controllers/reviews.controller';
import { OrdersController } from './modules/orders/controllers/orders.controller';
import { PaymentsController } from './modules/payments/controllers/payments.controller';
import { CartController } from './modules/cart/controllers/cart.controller';
import { SupportController } from './modules/support/controllers/support.controller';
import { ContentController } from './modules/content/controllers/content.controller';
import { WalletController } from './modules/wallet/controllers/wallet.controller';
import { CustomerController } from './modules/customer/controllers/customer.controller';
import { ServiceabilityController } from './modules/warehouses/controllers/serviceability.controller';
import { CheckoutController } from './modules/checkout/controllers/checkout.controller';
import { VendorController } from './modules/vendors/controllers/vendor.controller';
import { AdminVendorApprovalController } from './modules/vendors/controllers/admin-vendor-approval.controller';
import { ConstructionCalculatorController } from './modules/construction-calculator/controllers/construction-calculator.controller';
import { ConstructionCalculatorService } from './modules/construction-calculator/services/construction-calculator.service';
import { CompanyAdminModule } from './modules/company-admin/company-admin.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [CompanyAdminModule, RealtimeModule],
  controllers: [
    AppController,
    AuthController,
    CatalogueController,
    ProductsController,
    ReviewsController,
    OrdersController,
    PaymentsController,
    CartController,
    CheckoutController,
    SupportController,
    ContentController,
    WalletController,
    CustomerController,
    ServiceabilityController,
    VendorController,
    AdminVendorApprovalController,
    ConstructionCalculatorController,
  ],
  providers: [
    { provide: DatabaseService, useValue: databaseService },
    { provide: TaxonomyService, useValue: taxonomyService },
    ConstructionCalculatorService
  ],
  exports: [DatabaseService, TaxonomyService, ConstructionCalculatorService],
})
export class AppModule {}
