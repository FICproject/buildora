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
  getArticles() {
    return {
      success: true,
      data: dbStore.knowledgeArticles
    };
  }

  @Get('knowledge-hub/:slug')
  getArticleBySlug(@Param('slug') slug: string) {
    const article = dbStore.knowledgeArticles.find((a) => a.slug === slug);
    return {
      success: !!article,
      data: article
    };
  }

  @Get('faqs')
  getFaqs() {
    return {
      success: true,
      data: dbStore.faqs
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
