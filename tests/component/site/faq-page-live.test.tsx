import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FaqPage } from '@/site/pages/FaqPage';

describe('FaqPage Component', () => {
  it('renders FAQ questions and toggles answers on click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Sıkça Sorulan Sorular').length).toBeGreaterThan(0);
      expect(screen.getByText('Sipariş & Teslimat')).toBeInTheDocument();
    });

    const questionButton = screen.getByText('Seramik ürünler kargoda hasar görürse ne yapmalıyım?');
    expect(questionButton).toBeInTheDocument();

    await user.click(questionButton);
    expect(await screen.findByText(/Tüm gönderilerimiz kırılmaya karşı/i)).toBeInTheDocument();
  });
});
