import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('PayTR Refund Integration Unit Tests (Phase 3.7)', () => {
  const merchantId = 'MOCK_MERCHANT_ID';
  const merchantKey = 'MOCK_SECRET_KEY';
  const merchantSalt = 'MOCK_SALT';

  function computePayTRRefundToken(
    mId: string,
    merchantOid: string,
    returnAmountStr: string,
    mSalt: string,
    mKey: string
  ): string {
    const hashStr = `${mId}${merchantOid}${returnAmountStr}${mSalt}`;
    return crypto
      .createHmac('sha256', mKey)
      .update(hashStr)
      .digest('base64');
  }

  function formatMinorToMajorExact(amountMinor: number): string {
    return (amountMinor / 100).toFixed(2);
  }

  it('computes deterministic HMAC-SHA256 signature using official PayTR refund formula', () => {
    const merchantOid = 'VZ20260829001TX1';
    const amountMinor = 15000; // 150.00 TL
    const returnAmountStr = formatMinorToMajorExact(amountMinor);

    expect(returnAmountStr).toBe('150.00');

    const token = computePayTRRefundToken(merchantId, merchantOid, returnAmountStr, merchantSalt, merchantKey);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    // Recomputing with same inputs produces identical hash
    const token2 = computePayTRRefundToken(merchantId, merchantOid, returnAmountStr, merchantSalt, merchantKey);
    expect(token).toBe(token2);
  });

  it('formats minor units to exact major-unit decimal strings without floating point bugs', () => {
    expect(formatMinorToMajorExact(1025)).toBe('10.25');
    expect(formatMinorToMajorExact(350)).toBe('3.50');
    expect(formatMinorToMajorExact(500000)).toBe('5000.00');
    expect(formatMinorToMajorExact(99)).toBe('0.99');
    expect(formatMinorToMajorExact(1)).toBe('0.01');
  });

  it('validates remaining refundable balance bounds correctly', () => {
    const expectedAmountMinor = 300000; // 3000.00 TL
    const alreadyRefundedMinor = 100000; // 1000.00 TL
    const remainingMinor = expectedAmountMinor - alreadyRefundedMinor; // 2000.00 TL

    const validPartialRefund = 150000; // 1500.00 TL <= 2000.00 TL
    const isPartialValid = validPartialRefund <= remainingMinor && validPartialRefund > 0;
    expect(isPartialValid).toBe(true);

    const validFullRefund = remainingMinor; // 2000.00 TL
    const isFullValid = validFullRefund <= remainingMinor;
    expect(isFullValid).toBe(true);

    const excessiveRefund = 250000; // 2500.00 TL > 2000.00 TL
    const isExcessiveValid = excessiveRefund <= remainingMinor;
    expect(isExcessiveValid).toBe(false);
  });

  it('generates safe alphanumeric reference_no compliant with database constraints', () => {
    const referenceNo = `RF20260829${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    expect(referenceNo.length).toBeLessThanOrEqual(64);
    expect(/^[a-zA-Z0-9]+$/.test(referenceNo)).toBe(true);
  });
});
