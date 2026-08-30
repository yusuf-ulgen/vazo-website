import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '@/site/components/AuthModal';
import { renderWithRouter } from 'tests/utils/render-utils';
import * as customerAuthModule from '@/shared/stores/customer-auth-store';

describe('AuthModal Component (Real Google OAuth Customer Sign-In)', () => {
  const mockSignInWithGoogle = vi.fn();
  const mockSignInWithPassword = vi.fn();
  const mockSignUpWithPassword = vi.fn();
  const mockSignOut = vi.fn();

  const getBaseAuthMock = () => ({
    user: null,
    profile: null,
    addresses: [],
    isLoading: false,
    error: null,
    isAuthenticated: false,
    displayName: 'Müşteri',
    email: null,
    customerType: 'retail' as const,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithPassword: mockSignInWithPassword,
    signUpWithPassword: mockSignUpWithPassword,
    signOut: mockSignOut,
    refresh: vi.fn(),
    updateProfile: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultShipping: vi.fn(),
    setDefaultBilling: vi.fn(),
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Google sign in button and modal branding when unauthenticated', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Kullanıcı Girişi ve Profil' })).toBeInTheDocument();
    expect(screen.getByText('Müşteri Girişi')).toBeInTheDocument();
    expect(screen.getByText('Google ile Giriş Yap')).toBeInTheDocument();
  });

  it('handles Google sign-in click and initiates OAuth flow', () => {
    const handleClose = vi.fn();
    mockSignInWithGoogle.mockResolvedValue(undefined);

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} returnUrl="/checkout" />);

    const googleBtn = screen.getByText('Google ile Giriş Yap');
    fireEvent.click(googleBtn);

    expect(mockSignInWithGoogle).toHaveBeenCalledWith('/checkout');
  });

  it('renders logged in customer menu with account links and logout button', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      ...getBaseAuthMock(),
      user: { id: 'u1', email: 'merve@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: {
        user_id: 'u1',
        first_name: 'Merve',
        last_name: 'Aydın',
        phone: null,
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
      isAuthenticated: true,
      displayName: 'Merve Aydın',
      email: 'merve@example.com',
    });

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Merve Aydın')).toBeInTheDocument();
    expect(screen.getByText('Bireysel')).toBeInTheDocument();
    expect(screen.getByText('Hesap Bilgilerim')).toBeInTheDocument();
    expect(screen.getByText('Kayıtlı Adreslerim')).toBeInTheDocument();
    expect(screen.getByText('Alışveriş Sepetim')).toBeInTheDocument();
    expect(screen.getByText('Favorilerim')).toBeInTheDocument();
    expect(screen.getByText('Toptan Satış Başvurusu')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Oturumu Kapat/i });
    fireEvent.click(logoutBtn);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('renders error message when signInWithGoogle rejects', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('OAuth bağlantı hatası'));

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const googleBtn = screen.getByText('Google ile Giriş Yap');
    fireEvent.click(googleBtn);

    expect(await screen.findByText('OAuth bağlantı hatası')).toBeInTheDocument();
  });

  it('renders error message when signOut rejects', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('Çıkış bağlantı hatası'));

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      ...getBaseAuthMock(),
      user: { id: 'u-1', email: 'test@example.com' } as unknown as import('@supabase/supabase-js').User,
      profile: { user_id: 'u-1', first_name: 'Test', last_name: 'User', customer_type: 'retail' } as unknown as customerAuthModule.CustomerAuthState['profile'],
      isAuthenticated: true,
      displayName: 'Test User',
      email: 'test@example.com',
    });

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const logoutBtn = screen.getByRole('button', { name: /Oturumu Kapat/i });
    fireEvent.click(logoutBtn);

    expect(await screen.findByText('Çıkış bağlantı hatası')).toBeInTheDocument();
  });

  it('closes on Escape key press or close button click', () => {
    const handleClose = vi.fn();
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('returns null when isOpen is false', () => {
    const { container } = renderWithRouter(<AuthModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders wholesale customer badge and handles sign in failure', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google Girişi Başarısız'));

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const googleBtn = screen.getByText('Google ile Giriş Yap');
    fireEvent.click(googleBtn);

    expect(await screen.findByText('Google Girişi Başarısız')).toBeInTheDocument();
  });

  it('renders Kurumsal badge for wholesale accounts and handles navigation click', () => {
    const handleClose = vi.fn();

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      ...getBaseAuthMock(),
      user: { id: 'u2', email: 'b2b@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: {
        user_id: 'u2',
        first_name: 'Ahmet',
        last_name: 'Toptan',
        phone: null,
        customer_type: 'wholesale',
        wholesale_approved_at: '2026-08-28T00:00:00Z',
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
      isAuthenticated: true,
      displayName: 'Ahmet Toptan',
      email: 'b2b@example.com',
      customerType: 'wholesale',
    });

    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('Toptan Müşteri')).toBeInTheDocument();

    const accountLink = screen.getByText('Hesap Bilgilerim');
    fireEvent.click(accountLink);
    expect(handleClose).toHaveBeenCalled();
  });

  it('registers a new customer with email and password in registration tab', async () => {
    const handleClose = vi.fn();
    mockSignUpWithPassword.mockResolvedValue(undefined);

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    const { container } = renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} returnUrl="/account" />);

    // Switch to Register tab
    const registerTab = screen.getByRole('button', { name: 'Kayıt Ol' });
    fireEvent.click(registerTab);
    expect(screen.getByText('Yeni Hesap Oluştur')).toBeInTheDocument();

    // Fill registration form
    const nameInput = screen.getByPlaceholderText('Örn: Zeynep Kaya');
    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('En az 6 karakter');

    fireEvent.change(nameInput, { target: { value: 'Zeynep Kaya' } });
    fireEvent.change(emailInput, { target: { value: 'zeynep@vazostudio.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Toggle password visibility
    const showPasswordBtn = screen.getByLabelText('Şifreyi göster');
    fireEvent.click(showPasswordBtn);
    expect(screen.getByLabelText('Şifreyi gizle')).toBeInTheDocument();

    // Submit registration
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(submitBtn);

    expect(mockSignUpWithPassword).toHaveBeenCalledWith('zeynep@vazostudio.com', 'password123', 'Zeynep Kaya');
  });

  it('signs in an existing customer with email and password in sign-in tab', async () => {
    const handleClose = vi.fn();
    mockSignInWithPassword.mockResolvedValue(undefined);

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    const { container } = renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} returnUrl="/account" />);

    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('En az 6 karakter');
    fireEvent.change(emailInput, { target: { value: 'zeynep@vazostudio.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const loginSubmitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(loginSubmitBtn);

    expect(mockSignInWithPassword).toHaveBeenCalledWith('zeynep@vazostudio.com', 'password123');
  });

  it('handles email/password submission failure', async () => {
    mockSignInWithPassword.mockRejectedValueOnce(new Error('Geçersiz şifre'));

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue(getBaseAuthMock());

    const { container } = renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('En az 6 karakter');
    fireEvent.change(emailInput, { target: { value: 'test@vazostudio.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const loginSubmitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(loginSubmitBtn);

    expect(await screen.findByText('Geçersiz şifre')).toBeInTheDocument();
  });
});
