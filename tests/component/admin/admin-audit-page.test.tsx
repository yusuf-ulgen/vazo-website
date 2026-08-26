import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuditPage } from '@/admin/audit/pages/AdminAuditPage';
import { ToastProvider } from '@/admin/ui';

describe('AdminAuditPage Component', () => {
  it('renders audit trail page and displays audit logs with filtering', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/audit']}>
        <ToastProvider>
          <AdminAuditPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Denetim İzi & Güvenlik Günlüğü')).toBeInTheDocument();
    expect(screen.getByText('Değiştirilemez Günlük')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Pera Concept Store/i)).toBeInTheDocument();
    });

    // Test detail modal open
    const detailButtons = screen.getAllByTitle('Metadata İncele');
    expect(detailButtons.length).toBeGreaterThan(0);
    await user.click(detailButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText('Denetim İzi Kaydı')).toBeInTheDocument();
      expect(screen.getByText('Değiştirilemezlik Güvencesi:')).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByText('Kapat'));
    await waitFor(() => {
      expect(screen.queryByText('Değiştirilemezlik Güvencesi:')).not.toBeInTheDocument();
    });
  });
});
