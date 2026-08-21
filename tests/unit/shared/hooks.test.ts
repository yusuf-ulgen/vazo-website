import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

describe('shared hooks', () => {
  describe('useDisclosure', () => {
    it('defaults to false when no argument is given', () => {
      const { result } = renderHook(() => useDisclosure());
      expect(result.current.isOpen).toBe(false);
    });

    it('accepts custom initial state', () => {
      const { result } = renderHook(() => useDisclosure(true));
      expect(result.current.isOpen).toBe(true);
    });

    it('opens, closes, and toggles state correctly', () => {
      const { result } = renderHook(() => useDisclosure(false));

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setIsOpen(false);
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('useMediaQuery', () => {
    it('returns matchMedia result and updates on change event', () => {
      let listener: ((e: { matches: boolean }) => void) | null = null;

      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: query.includes('768px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn().mockImplementation((_event: string, cb: (e: { matches: boolean }) => void) => {
          listener = cb;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);

      act(() => {
        if (listener) {
          listener({ matches: false });
        }
      });

      expect(result.current).toBe(false);
    });
  });
});
