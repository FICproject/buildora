import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseService } from './database/database.service';
import { AuthController } from './modules/auth/controllers/auth.controller';
import { CatalogueController } from './modules/catalogue/controllers/catalogue.controller';
import { ProductsController } from './modules/products/controllers/products.controller';
import { OrdersController } from './modules/orders/controllers/orders.controller';
import { PaymentsController } from './modules/payments/controllers/payments.controller';
import { CartController } from './modules/cart/controllers/cart.controller';
import { SupportController } from './modules/support/controllers/support.controller';
import { ContentController } from './modules/content/controllers/content.controller';
import { WalletController } from './modules/wallet/controllers/wallet.controller';
import { CustomerController } from './modules/customer/controllers/customer.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    CatalogueController,
    ProductsController,
    OrdersController,
    PaymentsController,
    CartController,
    SupportController,
    ContentController,
    WalletController,
    CustomerController,
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class AppModule {}
