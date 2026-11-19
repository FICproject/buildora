import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { dbStore } from '../../../database/store';

@Controller('api/v1')
export class ContentController {
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

  @Post('bulk-orders/quotation')
  submitBulkQuotation(@Body() body: any) {
    const quote = {
      id: 'quo-' + Date.now(),
      quoteNumber: 'QUO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      ...body,
      status: 'PENDING',
      receivedAt: new Date().toISOString()
    };
    dbStore.bulkQuotations.push(quote);

    return {
      success: true,
      message: 'Bulk quotation request submitted successfully.',
      data: quote
    };
  }
}
