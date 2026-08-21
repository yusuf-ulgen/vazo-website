import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { AboutPage } from '@/site/pages/AboutPage';
import { ContactPage } from '@/site/pages/ContactPage';
import { FaqPage } from '@/site/pages/FaqPage';
import { WishlistPage } from '@/site/pages/WishlistPage';
import { CartPage } from '@/site/pages/CartPage';
import { ShippingReturnsPolicyPage } from '@/site/pages/policies/ShippingReturnsPolicyPage';
import { PrivacyKvkkPolicyPage } from '@/site/pages/policies/PrivacyKvkkPolicyPage';
import { TermsOfServicePage } from '@/site/pages/policies/TermsOfServicePage';
import { NotFoundPage } from '@/site/pages/NotFoundPage';
import { HomePage } from '@/site/pages/HomePage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';
import { cartStore } from '@/shared/stores/cart-store';
import { wishlistStore } from '@/shared/stores/wishlist-store';
import { productRepository } from '@/entities/product/api/product-repository';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('Content & Policy Pages Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cartStore.clear();
    wishlistStore.clear();
  });

  it('renders HomePage with all major visual sections', async () => {
    renderWithRouter(<HomePage />);
    expect(await screen.findByRole('link', { name: /Alışverişe Başla/ })).toBeInTheDocument();
  });

  it('renders AboutPage with studio heritage narrative', () => {
    renderWithRouter(<AboutPage />);
    expect(screen.getByText('Felsefemiz & Atölyemiz')).toBeInTheDocument();
    expect(screen.getByText('01 / Geleneksel Zanaat')).toBeInTheDocument();
  });

  it('renders ContactPage and submits form with real server response and resets form', async () => {
    vi.spyOn(contentRepository, 'submitContactMessage').mockResolvedValue({
      success: true,
      message: 'İletildi',
    });

    renderWithRouter(<ContactPage />);

    expect(screen.getByText('İletişim & Showroom')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Adınız Soyadınız'), {
      target: { value: 'Zeynep Kaya' },
    });
    fireEvent.change(screen.getByPlaceholderText('eposta@ornek.com'), {
      target: { value: 'zeynep@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mesajınızı buraya yazınız...'), {
      target: { value: 'Showroom randevusu almak istiyorum.' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Mesajı Gönder' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Mesajınız Alındı')).toBeInTheDocument();

    const newMsgBtn = screen.getByRole('button', { name: 'Yeni Mesaj Gönder' });
    fireEvent.click(newMsgBtn);

    expect(screen.getByPlaceholderText('Adınız Soyadınız')).toBeInTheDocument();
  });

  it('handles ContactPage submission failure gracefully', async () => {
    vi.spyOn(contentRepository, 'submitContactMessage').mockRejectedValue(
      new Error('Sunucu hatası oluştu')
    );

    renderWithRouter(<ContactPage />);

    fireEvent.change(screen.getByPlaceholderText('Adınız Soyadınız'), { target: { value: 'Ali Veli' } });
    fireEvent.change(screen.getByPlaceholderText('eposta@ornek.com'), { target: { value: 'ali@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mesajınızı buraya yazınız...'), { target: { value: 'Test mesajı' } });

    fireEvent.click(screen.getByRole('button', { name: 'Mesajı Gönder' }));
    expect(await screen.findByText('Sunucu hatası oluştu')).toBeInTheDocument();
  });

  it('renders FaqPage with accordion groups', () => {
    renderWithRouter(<FaqPage />);
    expect(screen.getAllByText('Sıkça Sorulan Sorular').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sipariş & Teslimat')).toBeInTheDocument();
  });

  it('renders WishlistPage in empty and filled state', async () => {
    const prod = createProduct({ id: 'p1', name: 'Favori Vazo', slug: 'favori-vazo' });
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([prod]);

    const { unmount } = renderWithRouter(<WishlistPage />);
    expect(await screen.findByText('Favori Listeniz Henüz Boş')).toBeInTheDocument();
    unmount();

    // Populate wishlist
    act(() => {
      wishlistStore.toggle('p1');
    });

    renderWithRouter(<WishlistPage />);
    expect(await screen.findByText('Favori Vazo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tümünü Sepete Ekle/ })).toBeInTheDocument();

    // Click "Tümünü Sepete Ekle"
    fireEvent.click(screen.getByRole('button', { name: /Tümünü Sepete Ekle/ }));
    expect(cartStore.getItems().length).toBe(1);

    // Clear wishlist
    fireEvent.click(screen.getByRole('button', { name: 'Tüm Favorileri Temizle' }));
    expect(wishlistStore.getItems().length).toBe(0);
  });

  it('renders CartPage with items, free shipping threshold warning, threshold congratulations, and removal', () => {
    const prod = createProduct({ id: 'p1', name: 'Sepetteki Vazo', retailPrice: 1500 });
    const variant = createVariant({ id: 'v1', name: 'Beyaz', retailPrice: 1500 });

    act(() => {
      cartStore.addItem(prod, variant, 2); // 3000 < 5000
    });

    const { unmount } = renderWithRouter(<CartPage />);

    expect(screen.getByText('Sipariş Özeti')).toBeInTheDocument();
    expect(screen.getByText('Sepetteki Vazo')).toBeInTheDocument();

    // Free shipping threshold remaining notice
    expect(screen.getByText(/Ücretsiz kargo için sepetinize/)).toBeInTheDocument();
    unmount();

    // Now test with >= 5000
    act(() => {
      cartStore.addItem(prod, variant, 2); // 6000 >= 5000
    });

    renderWithRouter(<CartPage />);
    expect(screen.getByText('Tebrikler! Siparişiniz ücretsiz kargo kapsamındadır.')).toBeInTheDocument();

    // Click checkout (triggers alert mock)
    const checkoutBtn = screen.getByRole('button', { name: /Ödemeye Geç/ });
    fireEvent.click(checkoutBtn);

    // Remove item
    const removeBtn = screen.getByRole('button', { name: 'Ürünü Kaldır' });
    fireEvent.click(removeBtn);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('renders Policy pages (Shipping & Returns, Privacy & KVKK, Terms)', () => {
    const { unmount: unmount1 } = renderWithRouter(<ShippingReturnsPolicyPage />);
    expect(screen.getByText('Kargo, Teslimat & İade Bilgilendirmesi')).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = renderWithRouter(<PrivacyKvkkPolicyPage />);
    expect(screen.getByText('Gizlilik Politikası & KVKK Aydınlatma Metni')).toBeInTheDocument();
    unmount2();

    const { unmount: unmount3 } = renderWithRouter(<TermsOfServicePage />);
    expect(screen.getByText('Kullanım Şartları & Mesafeli Sözleşme Genel İlkeleri')).toBeInTheDocument();
    unmount3();
  });

  it('renders NotFoundPage (404) with back to home CTA', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404 — Sayfa Bulunamadı')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ana Sayfaya Dön/ })).toHaveAttribute('href', '/');
  });
});
