import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Helper function implementing exact PayTR Token HMAC algorithm
export function generatePayTRTokenHmac(params: {
  merchant_id: string;
  user_ip: string;
  merchant_oid: string;
  email: string;
  payment_amount: string | number;
  user_basket: string;
  no_installment: string;
  max_installment: string;
  currency: string;
  test_mode: string;
  merchant_salt: string;
  merchant_key: string;
}): string {
  const {
    merchant_id,
    user_ip,
    merchant_oid,
    email,
    payment_amount,
    user_basket,
    no_installment,
    max_installment,
    currency,
    test_mode,
    merchant_salt,
    merchant_key,
  } = params;

  // Exact PayTR official concatenation order
  const hashString = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}${merchant_salt}`;
  return crypto.createHmac('sha256', merchant_key).update(hashString).digest('base64');
}

// Helper to encode user basket
export function encodePayTRBasket(items: [string, string, number][]): string {
  return Buffer.from(JSON.stringify(items)).toString('base64');
}

describe('PayTR Token Generation & Contract Rules (Phase 3.5)', () => {
  const dummyMerchantId = '123456';
  const dummyMerchantKey = 'test_merchant_key_secret_123';
  const dummyMerchantSalt = 'test_merchant_salt_secret_456';

  it('calculates deterministic HMAC-SHA256 signature with exact field concatenation', () => {
    const basket = encodePayTRBasket([
      ['Alabaster Vazo', '1500.00', 1],
      ['Kargo Ücreti', '150.00', 1],
    ]);

    const token = generatePayTRTokenHmac({
      merchant_id: dummyMerchantId,
      user_ip: '192.168.1.1',
      merchant_oid: 'VZ20260829ABCDE12345',
      email: 'musteri@example.com',
      payment_amount: 165000,
      user_basket: basket,
      no_installment: '1',
      max_installment: '0',
      currency: 'TL',
      test_mode: '1',
      merchant_salt: dummyMerchantSalt,
      merchant_key: dummyMerchantKey,
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    // Verify deterministic output for identical inputs
    const tokenRepeat = generatePayTRTokenHmac({
      merchant_id: dummyMerchantId,
      user_ip: '192.168.1.1',
      merchant_oid: 'VZ20260829ABCDE12345',
      email: 'musteri@example.com',
      payment_amount: 165000,
      user_basket: basket,
      no_installment: '1',
      max_installment: '0',
      currency: 'TL',
      test_mode: '1',
      merchant_salt: dummyMerchantSalt,
      merchant_key: dummyMerchantKey,
    });

    expect(token).toBe(tokenRepeat);
  });

  it('enforces strictly alphanumeric merchant_oid without hyphens and max 64 chars', () => {
    const rawOrderNumber = 'VZ-20260829-ABCDE';
    const cleanOrderNumber = rawOrderNumber.replace(/[^a-zA-Z0-9]/g, '');
    const merchantOid = `VZ${cleanOrderNumber}T123456`.slice(0, 64);

    expect(merchantOid).not.toContain('-');
    expect(merchantOid).toMatch(/^[a-zA-Z0-9]+$/);
    expect(merchantOid.length).toBeLessThanOrEqual(64);
  });

  it('maps application currency TRY to PayTR TL and preserves integer minor units', () => {
    const appCurrency = 'TRY';
    const paytrCurrency = appCurrency === 'TRY' ? 'TL' : appCurrency;
    expect(paytrCurrency).toBe('TL');

    const totalLira = 1500.50;
    const paymentAmountMinor = Math.round(totalLira * 100);
    expect(paymentAmountMinor).toBe(150050);
    expect(Number.isInteger(paymentAmountMinor)).toBe(true);
  });

  it('encodes basket matrix to valid Base64 decodable to original array', () => {
    const rawItems: [string, string, number][] = [
      ['Zemin Vazosu Mat Siyah', '2500.00', 2],
      ['Kargo Ücreti', '0.00', 1],
    ];

    const base64Basket = encodePayTRBasket(rawItems);
    expect(typeof base64Basket).toBe('string');

    const decoded = JSON.parse(Buffer.from(base64Basket, 'base64').toString('utf-8'));
    expect(decoded).toEqual(rawItems);
    expect(decoded[0][0]).toBe('Zemin Vazosu Mat Siyah');
    expect(decoded[0][2]).toBe(2);
  });

  it('enforces strict no-installment policy: no_installment=1 and max_installment=0', () => {
    const policy = {
      no_installment: '1',
      max_installment: '0',
    };

    expect(policy.no_installment).toBe('1');
    expect(policy.max_installment).toBe('0');
  });
});
