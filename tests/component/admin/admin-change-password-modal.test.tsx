import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminChangePasswordModal } from '@/admin/components/AdminChangePasswordModal';
import { adminAuthService } from '@/admin/auth/admin-auth-service';

vi.mock('@/admin/auth/admin-auth-service', () => ({
  adminAuthService: {
    changePassword: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

describe('AdminChangePasswordModal', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AdminChangePasswordModal isOpen={false} onClose={mockClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 password inputs when open', () => {
    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('Şifre Değiştir')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mevcut şifrenizi girin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('En az 6 karakter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin')).toBeInTheDocument();
  });

  it('shows error when current password is empty', async () => {
    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: 'NewPass123!' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /şifreyi güncelle/i }).closest('form')!);

    expect(await screen.findByText('Lütfen güncel şifrenizi giriniz.')).toBeInTheDocument();
    expect(adminAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is too short', async () => {
    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('Mevcut şifrenizi girin'), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: '123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /şifreyi güncelle/i }).closest('form')!);

    expect(
      await screen.findByText('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.')
    ).toBeInTheDocument();
    expect(adminAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new passwords do not match', async () => {
    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('Mevcut şifrenizi girin'), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: 'DifferentPass123!' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /şifreyi güncelle/i }).closest('form')!);

    expect(
      await screen.findByText('Yeni şifreler birbiriyle uyuşmuyor.')
    ).toBeInTheDocument();
    expect(adminAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is the same as current password', async () => {
    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('Mevcut şifrenizi girin'), {
      target: { value: 'SamePass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: 'SamePass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: 'SamePass123!' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /şifreyi güncelle/i }).closest('form')!);

    expect(
      await screen.findByText('Yeni şifreniz güncel şifrenizle aynı olamaz.')
    ).toBeInTheDocument();
    expect(adminAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('displays backend error if current password does not match database', async () => {
    vi.mocked(adminAuthService.changePassword).mockRejectedValueOnce(
      new Error('Güncel şifreniz uyuşmuyor.')
    );

    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('Mevcut şifrenizi girin'), {
      target: { value: 'WrongCurrentPassword' },
    });
    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: 'NewPass123!' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /şifreyi güncelle/i }).closest('form')!);

    expect(
      await screen.findByText('Güncel şifreniz uyuşmuyor.')
    ).toBeInTheDocument();
  });

  it('successfully submits and closes modal on valid password change', async () => {
    vi.mocked(adminAuthService.changePassword).mockResolvedValueOnce();

    render(<AdminChangePasswordModal isOpen={true} onClose={mockClose} />);

    fireEvent.change(screen.getByPlaceholderText('Mevcut şifrenizi girin'), {
      target: { value: 'CorrectCurrentPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('En az 6 karakter'), {
      target: { value: 'NewSecurePass2026!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Yeni şifrenizi tekrar girin'), {
      target: { value: 'NewSecurePass2026!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /şifreyi güncelle/i }));

    await waitFor(() => {
      expect(adminAuthService.changePassword).toHaveBeenCalledWith(
        'CorrectCurrentPass123!',
        'NewSecurePass2026!'
      );
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
