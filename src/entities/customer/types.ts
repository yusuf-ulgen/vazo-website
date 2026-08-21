export type CustomerType = 'retail' | 'wholesale';
export type TradeApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';

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
