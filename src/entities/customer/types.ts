export type CustomerType = 'retail' | 'wholesale';
export type TradeApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';

export interface CustomerProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  customer_type: CustomerType;
  wholesale_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  district: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country_code: string;
  country_name: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateAddressInput = Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateAddressInput = Partial<CreateAddressInput>;
export type UpdateProfileInput = Partial<Pick<CustomerProfile, 'first_name' | 'last_name' | 'phone'>>;

export interface Address {
  id: string;
  title: string;
  recipientName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Customer {
  id: string;
  type: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
  createdAt: string;
}

export interface TradeApplication {
  id: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  businessType: 'interior_designer' | 'boutique_retailer' | 'hotel_restaurant' | 'architect' | 'other';
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  estimatedMonthlyVolume: string;
  status: TradeApplicationStatus;
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
}
