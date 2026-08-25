import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '@/site/components/AuthModal';
import { renderWithRouter } from 'tests/utils/render-utils';
import { authStore } from '@/shared/stores/auth-store';

describe('AuthModal Component (Customer Storefront UX)', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
    vi.restoreAllMocks();
  });

  it('renders sign in form with email, password, and Google login button', () => {
    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Kullanıcı Girişi ve Profil' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ornek@vazostudio.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Google ile Devam Et')).toBeInTheDocument();
  });

  it('handles Google sign-in click', () => {
    const handleClose = vi.fn();
    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} />);

    const googleBtn = screen.getByText('Google ile Devam Et');
    fireEvent.click(googleBtn);

    expect(authStore.getUser()).not.toBeNull();
    expect(authStore.getUser()?.role).toBe('customer');
  });

  it('validates short password input on form submission', () => {
    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = emailInput.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12' } });
    fireEvent.submit(form);

    expect(screen.getByText('Şifreniz en az 4 karakter olmalıdır.')).toBeInTheDocument();
  });

  it('submits valid customer login and updates user state', async () => {
    const handleClose = vi.fn();
    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} />);

    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = emailInput.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'musteri@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'CustomerPass123' } });
    fireEvent.submit(form);

    expect(screen.getByText('musteri@gmail.com')).toBeInTheDocument();
    expect(authStore.getUser()?.email).toBe('musteri@gmail.com');
    expect(authStore.getUser()?.role).toBe('customer');

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('renders logged in user profile with customer links and logout', () => {
    authStore.login('musteri@gmail.com', 'Pass123', 'Merve');

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Merve')).toBeInTheDocument();
    expect(screen.getByText('Üye')).toBeInTheDocument();
    expect(screen.getByText('Favorilerim')).toBeInTheDocument();
    expect(screen.getByText('Alışveriş Sepetim')).toBeInTheDocument();
    expect(screen.getByText('Toptan Satış Başvurusu')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Oturumu Kapat/i });
    fireEvent.click(logoutBtn);

    expect(authStore.getUser()).toBeNull();
  });

  it('closes on Escape key press or close button click', () => {
    const handleClose = vi.fn();
    renderWithRouter(<AuthModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
