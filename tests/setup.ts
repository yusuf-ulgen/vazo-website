import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

// Console hygiene
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('[productRepository') ||
      msg.includes('[categoryRepository') ||
      msg.includes('[collectionRepository') ||
      msg.includes('[contentRepository') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Not implemented') ||
      msg.includes('not wrapped in act') ||
      msg.includes('The above error occurred')
    ) {
      return;
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('React Router') || msg.includes('UNSAFE_')) {
      return;
    }
    originalWarn(...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
