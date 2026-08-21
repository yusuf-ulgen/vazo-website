import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantitySelector } from '@/shared/ui/QuantitySelector';

describe('QuantitySelector Component', () => {
  it('renders current quantity value', () => {
    render(<QuantitySelector quantity={3} onChange={vi.fn()} min={1} max={10} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('increments quantity when increment button is clicked', () => {
    const handleChange = vi.fn();
    render(<QuantitySelector quantity={2} onChange={handleChange} min={1} max={5} />);

    const incBtn = screen.getByRole('button', { name: 'Adet Artır' });
    fireEvent.click(incBtn);

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('decrements quantity when decrement button is clicked', () => {
    const handleChange = vi.fn();
    render(<QuantitySelector quantity={4} onChange={handleChange} min={1} max={5} />);

    const decBtn = screen.getByRole('button', { name: 'Adet Azalt' });
    fireEvent.click(decBtn);

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('disables decrement button when quantity equals min', () => {
    render(<QuantitySelector quantity={1} onChange={vi.fn()} min={1} max={5} />);

    const decBtn = screen.getByRole('button', { name: 'Adet Azalt' });
    expect(decBtn).toBeDisabled();
  });

  it('disables increment button when quantity equals max', () => {
    render(<QuantitySelector quantity={5} onChange={vi.fn()} min={1} max={5} />);

    const incBtn = screen.getByRole('button', { name: 'Adet Artır' });
    expect(incBtn).toBeDisabled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<QuantitySelector quantity={1} onChange={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Adet Azalt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Adet Artır' })).toBeDisabled();
  });
});
