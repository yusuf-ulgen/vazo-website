import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AuthCallbackPage } from '@/site/pages/AuthCallbackPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import * as supabaseModule from '@/shared/lib/supabase';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import { saveAuthRedirect } from '@/shared/lib/safe-redirect';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthCallbackPage Component', () => {
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    vi.spyOn(customerAuthStore, 'refresh').mockResolvedValue(undefined);

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-cb-123',
            email: 'callback.user@example.com',
            user_metadata: { full_name: 'Test Customer' },
          },
        },
      },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            then: (resolve: (val: { data: unknown[]; error: unknown }) => void) =>
              resolve({ data: [], error: null }),
          }),
        }),
      }),
    });

    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      auth: {
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
        getUser: vi.fn(),
      },
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
  });

  it('renders loading state while resolving OAuth callback', () => {
    renderWithRouter(<AuthCallbackPage />);

    expect(screen.getByText('Oturum Açılıyor')).toBeInTheDocument();
    expect(screen.getByText('Kimlik Doğrulama')).toBeInTheDocument();
  });

  it('navigates to saved safe destination after session retrieval', async () => {
    saveAuthRedirect('/cart');
    renderWithRouter(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart', { replace: true });
    });
  });

  it('displays error state when OAuth session retrieval throws', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Google OAuth token expired or invalid' },
    });

    renderWithRouter(<AuthCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Giriş Başarısız Oldu')).toBeInTheDocument();
      expect(screen.getByText('Google OAuth token expired or invalid')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ana Sayfaya Dön' })).toBeInTheDocument();
    });

    const homeBtn = screen.getByRole('button', { name: 'Ana Sayfaya Dön' });
    homeBtn.click();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('handles unknown non-Error rejection during session retrieval', async () => {
    mockGetSession.mockRejectedValueOnce('Network Disconnected');

    renderWithRouter(<AuthCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Giriş Başarısız Oldu')).toBeInTheDocument();
      expect(screen.getByText('Giriş işlemi tamamlanırken beklenmedik bir hata oluştu.')).toBeInTheDocument();
    });
  });
});
