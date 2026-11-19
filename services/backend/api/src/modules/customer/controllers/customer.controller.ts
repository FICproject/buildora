import { Controller, Get, Put, Post, Delete, Body, Param } from '@nestjs/common';
import { Address, CustomerProfile } from '@buildora/types';

let mockProfile: CustomerProfile = {
  id: 'cust-demo-1',
  name: 'Arjun Verma',
  phone: '9876543210',
  email: 'arjun.verma@buildora.com',
  isPhoneVerified: true,
  isEmailVerified: true,
  gstin: '29AABCB1234F1Z8',
  businessName: 'Apex Infra Construction Ltd',
  walletBalance: 1250,
  rewardPoints: 480,
  createdAt: '2026-01-15T10:00:00.000Z'
};

let mockAddresses: Address[] = [
  {
    id: 'addr-1',
    type: 'CONSTRUCTION_SITE',
    recipientName: 'Arjun Verma (Site Engineer)',
    mobile: '9876543210',
    building: 'Plot 42, Green Horizon Enclave',
    street: '14th Cross, 4th Main Road',
    area: 'Indiranagar',
    landmark: 'Near BDA Complex',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    deliveryInstructions: 'Enter through Gate 2. Inform gate security for material truck unloading.',
    isDefault: true,
    isConstructionSite: true
  },
  {
    id: 'addr-2',
    type: 'WORK',
    recipientName: 'Arjun Verma',
    mobile: '9876543210',
    building: 'BuildTech Solutions, Office 302',
    street: 'Outer Ring Road, Bellandur',
    area: 'Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    isDefault: false
  }
];

@Controller('api/v1/customer')
export class CustomerController {
  @Get('profile')
  getProfile() {
    return {
      success: true,
      data: mockProfile
    };
  }

  @Put('profile')
  updateProfile(@Body() body: Partial<CustomerProfile>) {
    mockProfile = { ...mockProfile, ...body };
    return {
      success: true,
      message: 'Profile updated successfully',
      data: mockProfile
    };
  }

  @Get('addresses')
  getAddresses() {
    return {
      success: true,
      data: mockAddresses
    };
  }

  @Post('addresses')
  addAddress(@Body() body: Omit<Address, 'id'>) {
    const id = 'addr-' + Date.now();
    const newAddress: Address = {
      ...body,
      id,
      isDefault: body.isDefault || mockAddresses.length === 0
    };
    if (newAddress.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    mockAddresses.push(newAddress);
    return {
      success: true,
      message: 'Address added successfully',
      data: newAddress
    };
  }

  @Delete('addresses/:id')
  deleteAddress(@Param('id') id: string) {
    mockAddresses = mockAddresses.filter((a) => a.id !== id);
    return {
      success: true,
      message: 'Address removed successfully'
    };
  }
}
