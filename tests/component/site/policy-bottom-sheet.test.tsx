import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { PolicyBottomSheet } from '@/site/components/PolicyBottomSheet';
import { renderWithRouter } from 'tests/utils/render-utils';
import { policyDrawerStore } from '@/shared/stores/policy-drawer-store';

describe('PolicyBottomSheet Component', () => {
  beforeEach(() => {
    act(() => {
      policyDrawerStore.close();
    });
    vi.restoreAllMocks();
  });

  it('renders nothing when drawer is closed', () => {
    const { container } = renderWithRouter(<PolicyBottomSheet />);
    expect(container.firstChild).toBeNull();
  });

  it('renders bottom sheet drawer when opened and switches tabs', async () => {
    renderWithRouter(<PolicyBottomSheet />);

    act(() => {
      policyDrawerStore.open('privacy');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Gizlilik Politikası/i)).toBeInTheDocument();

    // Switch to Terms tab
    const termsTab = screen.getByRole('button', { name: 'Kullanım Koşulları' });
    fireEvent.click(termsTab);
    expect(await screen.findByText('Mesafeli Satış & Kullanım Koşulları')).toBeInTheDocument();

    // Switch to Shipping tab
    const shippingTab = screen.getByRole('button', { name: 'Teslimat & İade' });
    fireEvent.click(shippingTab);
    expect(await screen.findByText('Teslimat & İade Koşulları')).toBeInTheDocument();
  });

  it('closes when close button is clicked', async () => {
    renderWithRouter(<PolicyBottomSheet />);

    act(() => {
      policyDrawerStore.open('terms');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);

    expect(policyDrawerStore.getState().isOpen).toBe(false);
  });

  it('handles policy fetch rejection gracefully', async () => {
    const { contentRepository } = await import('@/entities/content/api/content-repository');
    vi.spyOn(contentRepository, 'getPolicyContent').mockRejectedValueOnce(new Error('Politika yüklenemedi'));

    renderWithRouter(<PolicyBottomSheet />);

    act(() => {
      policyDrawerStore.open('privacy');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
