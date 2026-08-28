import { CurrencyCode } from '@/shared/lib/money';

export type { CurrencyCode };

export interface ShippingZone {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  priority: number;
  retail_enabled: boolean;
  wholesale_enabled: boolean;
  created_at: string;
  updated_at: string;
  countries?: ShippingZoneCountry[];
  rates?: ShippingRate[];
}

export interface ShippingZoneCountry {
  id: string;
  zone_id: string;
  country_code: string;
  country_name: string;
  active: boolean;
  created_at: string;
}

export interface ShippingRate {
  id: string;
  zone_id: string;
  name: string;
  currency: CurrencyCode;
  flat_amount_minor: number;
  free_shipping_threshold_minor?: number | null;
  minimum_order_minor?: number | null;
  maximum_order_minor?: number | null;
  estimated_delivery_text?: string | null;
  active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShippingZoneInput {
  name: string;
  description?: string | null;
  active?: boolean;
  priority?: number;
  retail_enabled?: boolean;
  wholesale_enabled?: boolean;
}

export interface UpdateShippingZoneInput {
  name?: string;
  description?: string | null;
  active?: boolean;
  priority?: number;
  retail_enabled?: boolean;
  wholesale_enabled?: boolean;
}

export interface CreateShippingCountryInput {
  country_code: string;
  country_name: string;
  active?: boolean;
}

export interface CreateShippingRateInput {
  name: string;
  currency?: CurrencyCode;
  flat_amount_minor: number;
  free_shipping_threshold_minor?: number | null;
  minimum_order_minor?: number | null;
  maximum_order_minor?: number | null;
  estimated_delivery_text?: string | null;
  active?: boolean;
  priority?: number;
}

export interface UpdateShippingRateInput {
  name?: string;
  currency?: CurrencyCode;
  flat_amount_minor?: number;
  free_shipping_threshold_minor?: number | null;
  minimum_order_minor?: number | null;
  maximum_order_minor?: number | null;
  estimated_delivery_text?: string | null;
  active?: boolean;
  priority?: number;
}

export interface ShippingResolutionInput {
  country_code: string;
  channel?: 'retail' | 'wholesale';
  subtotal_minor?: number;
  currency?: CurrencyCode;
}

export interface ShippingResolutionResult {
  supported: boolean;
  zone_id?: string | null;
  zone_name?: string | null;
  rate_id?: string | null;
  rate_name?: string | null;
  shipping_minor: number;
  free_shipping_applied: boolean;
  estimated_delivery_text?: string | null;
  message?: string;
}
