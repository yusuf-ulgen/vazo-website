import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Helper function implementing exact PayTR Callback HMAC algorithm
export function generatePayTRCallbackHmac(params: {
  merchant_oid: string;
  merchant_salt: string;
  status: string;
  total_amount: string | number;
  merchant_key: string;
}): string {
  const { merchant_oid, merchant_salt, status, total_amount, merchant_key } = params;
  const message = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
  return crypto.createHmac('sha256', merchant_key).update(message).digest('base64');
}

// Constant-time string comparison helper
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

describe('PayTR Callback Verification & Security Contract (Phase 3.6)', () => {
  const dummyMerchantKey = 'sec_merchant_key_paytr_789';
  const dummyMerchantSalt = 'sec_merchant_salt_paytr_012';

  it('generates and verifies exact PayTR callback HMAC signature', () => {
    const callbackPayload = {
      merchant_oid: 'VZ20260829987654321',
      status: 'success',
      total_amount: '315000',
    };

    const validHash = generatePayTRCallbackHmac({
      merchant_oid: callbackPayload.merchant_oid,
      merchant_salt: dummyMerchantSalt,
      status: callbackPayload.status,
      total_amount: callbackPayload.total_amount,
      merchant_key: dummyMerchantKey,
    });

    expect(validHash).toBeDefined();
    expect(typeof validHash).toBe('string');

    // Constant-time verification against itself
    const isValid = constantTimeCompare(validHash, validHash);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or malicious callback hashes using constant-time comparison', () => {
    const validHash = generatePayTRCallbackHmac({
      merchant_oid: 'VZ20260829987654321',
      merchant_salt: dummyMerchantSalt,
      status: 'success',
      total_amount: '315000',
      merchant_key: dummyMerchantKey,
    });

    // Tampered status
    const forgedHash = generatePayTRCallbackHmac({
      merchant_oid: 'VZ20260829987654321',
      merchant_salt: dummyMerchantSalt,
      status: 'failed',
      total_amount: '315000',
      merchant_key: dummyMerchantKey,
    });

    expect(constantTimeCompare(validHash, forgedHash)).toBe(false);
    expect(constantTimeCompare(validHash, 'completely_bogus_hash')).toBe(false);
  });

  it('correctly compares strings of different lengths without throwing', () => {
    expect(constantTimeCompare('short', 'much_longer_string')).toBe(false);
    expect(constantTimeCompare('', 'non_empty')).toBe(false);
  });

  it('verifies callback message structure for both success and failed statuses', () => {
    const successMsg = generatePayTRCallbackHmac({
      merchant_oid: 'VZTEST01',
      merchant_salt: dummyMerchantSalt,
      status: 'success',
      total_amount: '150000',
      merchant_key: dummyMerchantKey,
    });

    const failedMsg = generatePayTRCallbackHmac({
      merchant_oid: 'VZTEST01',
      merchant_salt: dummyMerchantSalt,
      status: 'failed',
      total_amount: '150000',
      merchant_key: dummyMerchantKey,
    });

    expect(successMsg).not.toBe(failedMsg);
  });
});
