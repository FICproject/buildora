import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { DEFAULT_TENANT_ID } from '../../vendors/controllers/vendor.controller';

@Controller('api/v1')
export class ContentController {
  @Get('content/storefront')
  getPublishedStorefront(@Headers('x-tenant-id') tenantId?: string) {
    return {
      success: true,
      data: companyAdminDataService.getPublishedStorefrontContent(
        tenantId || DEFAULT_TENANT_ID
      ),
    };
  }

  @Get('knowledge-hub')
  getArticles(@Headers('x-tenant-id') tenantId?: string) {
    const activeTenant = tenantId || DEFAULT_TENANT_ID;
    const articles = dbStore.knowledgeArticles.filter(
      (a: any) => a.isPublished !== false && (!a.tenantId || a.tenantId === activeTenant)
    );
    return {
      success: true,
      data: articles
    };
  }

  @Get('knowledge-hub/:slug')
  getArticleBySlug(@Param('slug') slug: string, @Headers('x-tenant-id') tenantId?: string) {
    const activeTenant = tenantId || DEFAULT_TENANT_ID;
    const article = dbStore.knowledgeArticles.find(
      (a: any) => a.slug === slug && a.isPublished !== false && (!a.tenantId || a.tenantId === activeTenant)
    );
    return {
      success: !!article,
      data: article
    };
  }

  @Get('faqs')
  getFaqs(@Headers('x-tenant-id') tenantId?: string) {
    const activeTenant = tenantId || DEFAULT_TENANT_ID;
    const faqs = dbStore.faqs.filter(
      (f: any) => f.isActive !== false && (!f.tenantId || f.tenantId === activeTenant)
    );
    return {
      success: true,
      data: faqs
    };
  }

  @Post('contact')
  submitContactForm(@Body() body: any) {
    const inquiry = {
      id: 'inq-' + Date.now(),
      ...body,
      receivedAt: new Date().toISOString()
    };
    dbStore.contactInquiries.push(inquiry);

    return {
      success: true,
      message: 'Inquiry received. A site advisor will contact you within 30 minutes.',
      data: inquiry
    };
  }
}
