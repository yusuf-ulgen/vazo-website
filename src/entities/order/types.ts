import { Address } from '../customer/types';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  channel: 'retail' | 'wholesale';
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: 'retail' | 'wholesale';
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}
