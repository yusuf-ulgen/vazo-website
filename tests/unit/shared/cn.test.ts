import { describe, it, expect } from 'vitest';
import { cn } from '@/shared/lib/cn';

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional class names properly', () => {
    const isActive = true;
    const isHidden = false;
    expect(cn('base', isActive && 'active', isHidden && 'hidden')).toBe('base active');
  });

  it('handles falsy, null, and undefined values cleanly', () => {
    expect(cn('base', null, undefined, false, '', 'extra')).toBe('base extra');
  });

  it('resolves Tailwind CSS class conflicts using tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('text-sm font-light', 'text-base font-bold')).toBe('text-base font-bold');
  });

  it('handles array inputs and objects', () => {
    expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz');
  });

  it('returns empty string when given no arguments or only falsy values', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});
