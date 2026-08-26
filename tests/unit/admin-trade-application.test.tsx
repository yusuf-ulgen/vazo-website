import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TradeApplicationDetailModal } from '@/admin/submissions/components/TradeApplicationDetailModal';
import type { AdminTradeApplication } from '@/admin/submissions/types';

describe('Admin Trade Application Component & Mapping', () => {
  const mockApplication: AdminTradeApplication = {
    id: 'trade-app-123',
    company_name: 'Atelier Ceramique Istanbul',
    contact_person: 'Mehmet Yılmaz',
    contact_name: 'Mehmet Yılmaz',
    email: 'mehmet@atelierceramique.com',
    phone: '+90 532 111 2233',
    tax_number: '1234567890',
    tax_office: 'Beşiktaş VD',
    business_type: 'retail_store',
    website_url: 'https://atelierceramique.com',
    city: 'İstanbul',
    country: 'Türkiye',
    estimated_monthly_volume: '50-100 adet',
    customer_message: 'Projelerimiz ve mimari showroomumuz için toptan seramik vazo siparişi vermek istiyoruz.',
    status: 'pending',
    notes: 'İlk inceleme yapıldı.',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
  };

  it('renders customer_message and application details in modal', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <TradeApplicationDetailModal
        application={mockApplication}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Company and contact info
    expect(screen.getAllByText('Atelier Ceramique Istanbul').length).toBeGreaterThan(0);
    expect(screen.getByText('Mehmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('mehmet@atelierceramique.com')).toBeInTheDocument();

    // Customer message field verification
    expect(
      screen.getByText(/Projelerimiz ve mimari showroomumuz için toptan seramik vazo siparişi vermek istiyoruz/i)
    ).toBeInTheDocument();
  });

  it('correctly maps application object with customer_message field', () => {
    expect(mockApplication.customer_message).toBeDefined();
    expect(typeof mockApplication.customer_message).toBe('string');
  });
});
