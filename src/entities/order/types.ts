import { CustomerAddress } from '../customer/types';
import { CurrencyCode, Money } from '@/shared/lib/money';

export type { CurrencyCode, Money };

export type OrderChannel = 'retail' | 'wholesale';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded'
  | 'payment_review';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  sku_snapshot: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  image_url_snapshot: string | null;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
  currency: CurrencyCode;
  channel: OrderChannel;
  metadata_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  channel: OrderChannel;
  status: OrderStatus;
  currency: CurrencyCode;
  tax_included: boolean;
  subtotal_minor: number;
  shipping_minor: number;
  discount_minor: number;
  tax_included_minor: number;
  total_minor: number;
  shipping_address: CustomerAddress;
  billing_address: CustomerAddress;
  seller_legal_snapshot?: Record<string, unknown> | null;
  customer_legal_snapshot?: Record<string, unknown> | null;
  shipping_carrier?: string | null;
  shipping_tracking_number?: string | null;
  shipping_tracking_url?: string | null;
  cancellation_reason?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  items?: OrderItem[];
}

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'partially_refunded'
  | 'refunded'
  | 'manual_review';

export interface Payment {
  id: string;
  order_id: string;
  provider: 'paytr';
  merchant_oid: string;
  status: PaymentStatus;
  expected_amount_minor: number;
  provider_total_amount_minor?: number | null;
  currency: CurrencyCode;
  test_mode: boolean;
  failure_code?: string | null;
  failure_message_safe?: string | null;
  initiated_at: string;
  expires_at: string;
  paid_at?: string | null;
  failed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  order_id: string;
  merchant_oid: string;
  event_type: string;
  event_fingerprint: string;
  safe_metadata: Record<string, unknown>;
  received_at: string;
}

export type InventoryReservationStatus = 'reserved' | 'converted' | 'released' | 'expired';

export interface InventoryReservation {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  status: InventoryReservationStatus;
  reserved_at: string;
  expires_at: string;
  converted_at?: string | null;
  released_at?: string | null;
  created_at: string;
}

export type InventoryMovementType =
  | 'sale'
  | 'refund_restock'
  | 'order_cancellation_release'
  | 'manual_adjustment_reference'
  | 'initial_stock'
  | 'scrap_loss';

export interface InventoryMovement {
  id: string;
  variant_id: string;
  order_id?: string | null;
  quantity_delta: number;
  movement_type: InventoryMovementType;
  safe_reason: string;
  actor_type: 'system' | 'customer' | 'admin';
  actor_id?: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: string | null;
  to_status: OrderStatus;
  actor_type: 'system' | 'customer' | 'admin';
  actor_id?: string | null;
  note?: string | null;
  created_at: string;
}

export type LegalDocumentKey =
  | 'distance_sales_agreement'
  | 'preliminary_information_form'
  | 'terms_of_service'
  | 'privacy_policy';

export interface OrderLegalAcceptance {
  id: string;
  order_id: string;
  document_key: LegalDocumentKey;
  document_version: string;
  content_snapshot: Record<string, unknown>;
  accepted_at: string;
}

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export interface Refund {
  id: string;
  order_id: string;
  payment_id: string;
  request_id: string;
  reference_no: string;
  amount_minor: number;
  currency: CurrencyCode;
  status: RefundStatus;
  requested_by?: string | null;
  safe_reason?: string | null;
  provider_error_code?: string | null;
  provider_error_message?: string | null;
  requested_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'not_requested' | 'pending' | 'issued' | 'failed' | 'cancelled';

export interface OrderInvoice {
  id: string;
  order_id: string;
  status: InvoiceStatus;
  provider?: string | null;
  invoice_number?: string | null;
  issued_at?: string | null;
  error_message_safe?: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface TransactionalEmail {
  id: string;
  order_id?: string | null;
  customer_id?: string | null;
  recipient_email: string;
  template_key: string;
  payload_safe: Record<string, unknown>;
  status: EmailStatus;
  attempt_count: number;
  available_at: string;
  sent_at?: string | null;
  last_error_safe?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutQuoteItemInput {
  variant_id: string;
  quantity: number;
}

export interface CheckoutQuoteItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  image_url: string | null;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
}

export interface CheckoutQuoteRequest {
  items: CheckoutQuoteItemInput[];
  channel?: OrderChannel;
  currency?: CurrencyCode;
  destination_country?: string;
}

export interface CheckoutQuoteResponse {
  supported: boolean;
  channel: OrderChannel;
  currency: CurrencyCode;
  destination_country: string;
  items: CheckoutQuoteItem[];
  subtotal_minor: number;
  shipping_minor: number;
  free_shipping_applied: boolean;
  estimated_delivery_text: string | null;
  discount_minor: number;
  tax_included: boolean;
  tax_rate: number;
  tax_included_minor: number;
  total_minor: number;
  message?: string;
}

export interface CreateOrderRequest {
  items: CheckoutQuoteItemInput[];
  channel?: OrderChannel;
  currency?: CurrencyCode;
  destination_country?: string;
  shipping_address: CustomerAddress;
  billing_address?: CustomerAddress;
  accepted_preliminary_info: boolean;
  accepted_distance_sales: boolean;
}

export interface CreateOrderResponse {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
  currency: CurrencyCode;
  expires_at: string;
  payment_timeout_minutes: number;
  reservation_timeout_minutes: number;
}

export interface PayTRTokenRequest {
  order_id: string;
}

export interface PayTRTokenResponse {
  success: boolean;
  token: string;
  iframe_url: string;
  merchant_oid: string;
  is_test_mode: boolean;
  error?: string;
}

