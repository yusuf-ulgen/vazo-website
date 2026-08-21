import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

describe('shared hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('useDialogFocusTrap', () => {
    it('locks body scroll on open and restores on unmount', () => {
      const onClose = vi.fn();
      const { unmount } = renderHook(() => useDialogFocusTrap({ isOpen: true, onClose }));

      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('triggers onClose on Escape key press', () => {
      const onClose = vi.fn();
      renderHook(() => useDialogFocusTrap({ isOpen: true, onClose }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('focuses initialFocusRef if provided', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const input = document.createElement('input');
      document.body.appendChild(input);
      const inputRef = { current: input };

      renderHook(() => useDialogFocusTrap({ isOpen: true, onClose, initialFocusRef: inputRef }));

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(document.activeElement).toBe(input);
      document.body.removeChild(input);
      vi.useRealTimers();
    });

    it('focuses first element if initialFocusRef is not provided', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const container = document.createElement('div');
      const btn = document.createElement('button');
      container.appendChild(btn);
      document.body.appendChild(container);

      const { result } = renderHook(() => useDialogFocusTrap({ isOpen: true, onClose }));
      result.current.containerRef.current = container;

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(document.activeElement).toBe(btn);
      document.body.removeChild(container);
      vi.useRealTimers();
    });

    it('manages tab focus cycle within container', () => {
      const onClose = vi.fn();
      const container = document.createElement('div');
      const btn1 = document.createElement('button');
      const btn2 = document.createElement('button');
      container.appendChild(btn1);
      container.appendChild(btn2);
      document.body.appendChild(container);

      const { result } = renderHook(() => useDialogFocusTrap({ isOpen: true, onClose }));
      result.current.containerRef.current = container;

      // Focus second button and trigger Tab
      btn2.focus();
      expect(document.activeElement).toBe(btn2);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      });
      expect(document.activeElement).toBe(btn1);

      // Focus first button and trigger Shift+Tab
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
      });
      expect(document.activeElement).toBe(btn2);

      document.body.removeChild(container);
    });

    it('handles empty container gracefully when Tab is pressed', () => {
      const onClose = vi.fn();
      const container = document.createElement('div');
      document.body.appendChild(container);

      const { result } = renderHook(() => useDialogFocusTrap({ isOpen: true, onClose }));
      result.current.containerRef.current = container;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      });

      document.body.removeChild(container);
    });
  });
});
