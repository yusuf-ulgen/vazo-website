import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeText } from '@/shared/lib/sanitize';

describe('Sanitize Utility', () => {
  it('strips dangerous <script> tags and inner code', () => {
    const malicious = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeHtml(malicious)).toBe('Hello  World');
  });

  it('strips inline event handlers like onclick and onerror', () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(1)" onclick="steal()" alt="vase" />';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('alt="vase"');
  });

  it('strips javascript: pseudo-protocols', () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    expect(sanitizeHtml(malicious)).not.toContain('javascript:');
  });

  it('strips iframe and object tags', () => {
    const malicious = '<div><iframe src="http://evil.com"></iframe><object data="evil"></object></div>';
    expect(sanitizeHtml(malicious)).toBe('<div></div>');
  });

  it('handles empty or non-string input safely', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(escapeText('')).toBe('');
  });

  it('escapes plain text characters properly', () => {
    expect(escapeText('<div class="box">&test\'s</div>')).toBe(
      '&lt;div class=&quot;box&quot;&gt;&amp;test&#039;s&lt;/div&gt;'
    );
  });
});
