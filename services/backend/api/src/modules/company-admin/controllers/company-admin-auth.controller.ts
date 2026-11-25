import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  Req,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { companyAdminSecurityService } from '../services/company-admin-security.service';
import {
  companyAdminDataService,
  CompanyAdminUserRecord,
} from '../services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyAdminUserModel,
} from '../services/company-admin-persistence.service';

@Controller('api/v1/company-admin/auth')
export class CompanyAdminAuthController {
  private sanitizeUser(user: CompanyAdminUserRecord) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  @Post('login')
  login(
    @Body() body: { email?: string; password?: string; tenantId?: string },
    @Headers('x-tenant-id') headerTenantId?: string,
    @Req() req?: any
  ) {
    const email = (body?.email || '').trim().toLowerCase();
    const password = body?.password || '';
    const clientIp = req?.ip || '127.0.0.1';

    companyAdminSecurityService.checkRateLimit(`ca-login:${clientIp}`, 40, 60_000);
    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    companyAdminSecurityService.checkLockout(email);

    const user = Array.from(companyAdminDataService.adminUsers.values()).find(
      (u) => u.email.toLowerCase() === email
    );

    if (!user || !companyAdminSecurityService.verifyPassword(password, user.passwordHash)) {
      const lockStatus = companyAdminSecurityService.recordFailedLogin(email);
      throw new UnauthorizedException(
        lockStatus.isLocked
          ? 'Too many failed login attempts. Account locked for 15 minutes.'
          : `Invalid email or password. ${lockStatus.remaining} attempt(s) remaining.`
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(`Account is ${user.status}. Contact your Company Owner.`);
    }

    const requestedTenant = body?.tenantId || headerTenantId;
    if (requestedTenant && requestedTenant !== user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation error: Account does not belong to the requested company workspace.'
      );
    }

    companyAdminSecurityService.clearFailedLogins(email);
    user.lastLoginAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyAdminUserModel, user);

    const tenant = companyAdminDataService.tenants.get(user.tenantId);
    const tokens = companyAdminSecurityService.generateTokens(user);

    companyAdminDataService.recordAuditLog({
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'ADMIN_LOGIN',
      module: 'Auth',
      entityType: 'CompanyAdminUser',
      entityId: user.id,
      details: `${user.email} signed in (${user.role}).`,
      ipAddress: clientIp,
    });

    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        tenant,
        ...tokens,
      },
    };
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken?: string }) {
    if (!body?.refreshToken) {
      throw new BadRequestException('refreshToken is required.');
    }
    const entry = companyAdminSecurityService.consumeRefreshToken(body.refreshToken);
    const user = companyAdminDataService.adminUsers.get(entry.userId);
    if (!user || user.status !== 'ACTIVE' || user.tenantId !== entry.tenantId) {
      throw new UnauthorizedException('Admin account unavailable or tenant mismatch.');
    }
    const tokens = companyAdminSecurityService.generateTokens(user);
    const tenant = companyAdminDataService.tenants.get(user.tenantId);
    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        tenant,
        ...tokens,
      },
    };
  }

  @Get('me')
  me(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    companyAdminSecurityService.assertTenantAccess(admin, headerTenantId);

    const user = companyAdminDataService.adminUsers.get(admin.sub);
    if (!user) {
      throw new UnauthorizedException('Admin account not found.');
    }
    const tenant = companyAdminDataService.tenants.get(user.tenantId);
    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        tenant,
      },
    };
  }

  @Post('logout')
  logout(
    @Body() body: { refreshToken?: string },
    @Headers('authorization') authHeader?: string,
    @Req() req?: any
  ) {
    companyAdminSecurityService.revokeRefreshToken(body?.refreshToken);
    try {
      if (authHeader) {
        const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
        companyAdminDataService.recordAuditLog({
          tenantId: admin.tenantId,
          actorId: admin.sub,
          actorName: admin.name,
          actorRole: admin.role,
          action: 'ADMIN_LOGOUT',
          module: 'Auth',
          entityType: 'CompanyAdminUser',
          entityId: admin.sub,
          details: `${admin.email} signed out.`,
          ipAddress: req?.ip || '127.0.0.1',
        });
      }
    } catch {
      // Ignore expired token on logout
    }
    return { success: true, message: 'Logged out safely.' };
  }

  @Put('change-password')
  changePassword(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { currentPassword?: string; newPassword?: string },
    @Req() req?: any
  ) {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    const user = companyAdminDataService.adminUsers.get(admin.sub);
    if (!user) throw new UnauthorizedException('Admin user not found.');
    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException('Current password and new password are required.');
    }
    if (!companyAdminSecurityService.verifyPassword(body.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.passwordHash = companyAdminSecurityService.hashPassword(body.newPassword);
    void companyAdminPersistenceService.upsert(CompanyAdminUserModel, user);

    companyAdminDataService.recordAuditLog({
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      module: 'Security',
      entityType: 'CompanyAdminUser',
      entityId: user.id,
      details: 'Account password rotated by admin.',
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, message: 'Password updated successfully.' };
  }
}
