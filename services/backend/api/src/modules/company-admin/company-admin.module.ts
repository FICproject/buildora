import { Module } from '@nestjs/common';
import { CompanyAdminAuthController } from './controllers/company-admin-auth.controller';
import { CompanyAdminController } from './controllers/company-admin.controller';
import {
  CompanyAdminDataService,
  companyAdminDataService,
} from './services/company-admin-data.service';
import {
  CompanyAdminSecurityService,
  companyAdminSecurityService,
} from './services/company-admin-security.service';

@Module({
  controllers: [CompanyAdminAuthController, CompanyAdminController],
  providers: [
    { provide: CompanyAdminDataService, useValue: companyAdminDataService },
    { provide: CompanyAdminSecurityService, useValue: companyAdminSecurityService },
  ],
  exports: [CompanyAdminDataService, CompanyAdminSecurityService],
})
export class CompanyAdminModule {}
