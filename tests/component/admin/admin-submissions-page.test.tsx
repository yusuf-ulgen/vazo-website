import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSubmissionsPage } from '@/admin/submissions/pages/AdminSubmissionsPage';
import { ToastProvider } from '@/admin/ui';

describe('AdminSubmissionsPage Component', () => {
  it('renders submissions page and allows switching between tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/submissions']}>
        <ToastProvider>
          <AdminSubmissionsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Gelen Başvurular & İletişim')).toBeInTheDocument();
    expect(screen.getByText('İletişim Mesajları')).toBeInTheDocument();
    expect(screen.getByText('Toptan & B2B Başvuruları')).toBeInTheDocument();
    expect(screen.getByText('E-Bülten Aboneleri')).toBeInTheDocument();

    // Default tab is contact messages
    await waitFor(() => {
      expect(screen.getByText('Elif Karahan')).toBeInTheDocument();
    });

    // Switch to Trade tab
    await user.click(screen.getByText('Toptan & B2B Başvuruları'));
    await waitFor(() => {
      expect(screen.getByText(/Artisan Tasarım/i)).toBeInTheDocument();
    });

    // Switch to Newsletter tab
    await user.click(screen.getByText('E-Bülten Aboneleri'));
    await waitFor(() => {
      expect(screen.getByText('cem.arslan@gmail.com')).toBeInTheDocument();
    });
  });
});
