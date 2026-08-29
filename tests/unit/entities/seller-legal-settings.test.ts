import { describe, it, expect } from 'vitest';
import {
  SELLER_LEGAL_REQUIRED_FIELDS,
  DEFAULT_SELLER_LEGAL,
  SellerLegalSettings,
} from '@/entities/settings/types';

describe('Seller Legal Settings Contract (Phase 3.10)', () => {
  it('defines 9 required legal fields for sole proprietor compliance', () => {
    expect(SELLER_LEGAL_REQUIRED_FIELDS).toEqual([
      'business_type',
      'owner_full_name',
      'legal_trade_title',
      'tax_office',
      'tax_number',
      'registered_address',
      'kep_address',
      'business_email',
      'business_phone',
    ]);
  });

  it('keeps MERSIS number strictly optional for sole proprietors', () => {
    // MERSIS is not in the mandatory fields list
    expect(SELLER_LEGAL_REQUIRED_FIELDS).not.toContain('mersis_number');
    expect(SELLER_LEGAL_REQUIRED_FIELDS).not.toContain('chamber_name');
    expect(SELLER_LEGAL_REQUIRED_FIELDS).not.toContain('chamber_registration_number');
    expect(SELLER_LEGAL_REQUIRED_FIELDS).not.toContain('trade_registry_number');
    expect(SELLER_LEGAL_REQUIRED_FIELDS).not.toContain('brand_name');

    // Default template has null/empty values without fake data
    expect(DEFAULT_SELLER_LEGAL.mersis_number).toBeNull();
    expect(DEFAULT_SELLER_LEGAL.business_type).toBe('');
    expect(DEFAULT_SELLER_LEGAL.owner_full_name).toBe('');
    expect(DEFAULT_SELLER_LEGAL.tax_number).toBe('');
  });

  it('correctly calculates completeness when sole proprietor fills all 9 required fields without MERSIS', () => {
    const validSoleProprietor: SellerLegalSettings = {
      business_type: 'Şahıs Şirketi / Gerçek Kişi Tacir',
      owner_full_name: 'Yusuf Ülgen',
      legal_trade_title: 'Yusuf Ülgen Monocactus Tasarım',
      brand_name: 'Monocactus',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy Kemankeş Cad. No:42, İstanbul',
      kep_address: 'yusuf.ulgen@hs01.kep.tr',
      business_email: 'info@monocactus.com',
      business_phone: '+90 (212) 555 0192',
      chamber_name: null,
      chamber_registration_number: null,
      trade_registry_number: null,
      mersis_number: null, // Strictly null / optional
    };

    const isComplete = SELLER_LEGAL_REQUIRED_FIELDS.every((field) => {
      const val = validSoleProprietor[field];
      return typeof val === 'string' && val.trim() !== '';
    });

    expect(isComplete).toBe(true);
  });

  it('identifies missing required fields accurately', () => {
    const incompleteProfile: Partial<SellerLegalSettings> = {
      business_type: 'Şahıs Şirketi',
      owner_full_name: 'Yusuf Ülgen',
      tax_office: 'Beyoğlu',
      // missing: legal_trade_title, tax_number, registered_address, kep_address, business_email, business_phone
    };

    const missingFields = SELLER_LEGAL_REQUIRED_FIELDS.filter((field) => {
      const val = incompleteProfile[field];
      return !val || typeof val !== 'string' || val.trim() === '';
    });

    expect(missingFields).toContain('legal_trade_title');
    expect(missingFields).toContain('tax_number');
    expect(missingFields).toContain('registered_address');
    expect(missingFields).toContain('kep_address');
    expect(missingFields).toContain('business_email');
    expect(missingFields).toContain('business_phone');
    expect(missingFields.length).toBe(6);
  });
});
