import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '@/site/components/AuthModal';
import { renderWithRouter } from 'tests/utils/render-utils';
import { authStore } from '@/shared/stores/auth-store';

describe('AuthModal Component', () => {
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

  it('shows error on wrong admin password and logs in on correct password', () => {
    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    const emailInput = screen.getByPlaceholderText('ornek@vazostudio.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = emailInput.closest('form')!;

    // Wrong password
    fireEvent.change(emailInput, { target: { value: 'adminvazo@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass' } });
    fireEvent.submit(form);

    expect(screen.getByText('Yönetici şifresi hatalı.')).toBeInTheDocument();

    // Correct password
    fireEvent.change(passwordInput, { target: { value: 'LocalDev123' } });
    fireEvent.submit(form);

    expect(authStore.getUser()?.role).toBe('admin');
  });

  it('renders logged in user profile with admin controls and logout', () => {
    authStore.login('adminvazo@gmail.com', 'LocalDev123');

    renderWithRouter(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Yönetici Paneline Git')).toBeInTheDocument();

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
