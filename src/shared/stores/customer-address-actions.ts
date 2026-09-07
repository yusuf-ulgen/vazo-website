import { customerAddressRepository } from '@/entities/customer/api/customer-address-repository';
import type {
  CustomerAddress,
  CreateAddressInput,
  UpdateAddressInput,
} from '@/entities/customer/types';

export const customerAddressActions = {
  async createAddress(userId: string, input: CreateAddressInput): Promise<CustomerAddress> {
    return customerAddressRepository.createAddress(userId, input);
  },

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<CustomerAddress> {
    return customerAddressRepository.updateAddress(userId, addressId, input);
  },

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    return customerAddressRepository.deleteAddress(userId, addressId);
  },

  async setDefaultShipping(userId: string, addressId: string): Promise<void> {
    return customerAddressRepository.setDefaultShipping(userId, addressId);
  },

  async setDefaultBilling(userId: string, addressId: string): Promise<void> {
    return customerAddressRepository.setDefaultBilling(userId, addressId);
  },
};
