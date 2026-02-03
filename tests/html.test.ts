import { describe, expect, test } from 'bun:test';
import { htmlToText, wrapText } from '../src/utils/html';

describe('htmlToText', () => {
  test('handles null/undefined', () => {
    expect(htmlToText(null)).toBe('');
    expect(htmlToText(undefined)).toBe('');
    expect(htmlToText('')).toBe('');
  });

  test('strips HTML tags', () => {
    expect(htmlToText('<p>Hello</p>')).toBe('Hello');
    expect(htmlToText('<div>Test</div>')).toBe('Test');
  });

  test('converts paragraphs to newlines', () => {
    expect(htmlToText('<p>First</p><p>Second</p>')).toBe('First\n\nSecond');
  });

  test('converts br tags to newlines', () => {
    expect(htmlToText('Line 1<br>Line 2')).toBe('Line 1\nLine 2');
    expect(htmlToText('Line 1<br/>Line 2')).toBe('Line 1\nLine 2');
    expect(htmlToText('Line 1<br />Line 2')).toBe('Line 1\nLine 2');
  });

  test('handles unordered lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = htmlToText(html);
    expect(result).toContain('* Item 1');
    expect(result).toContain('* Item 2');
  });

  test('handles ordered lists with numbers', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const result = htmlToText(html);
    expect(result).toContain('1. First');
    expect(result).toContain('2. Second');
  });

  test('preserves inline formatting content', () => {
    expect(htmlToText('<strong>bold</strong>')).toBe('bold');
    expect(htmlToText('<em>italic</em>')).toBe('italic');
    expect(htmlToText('<code>code</code>')).toBe('`code`');
  });

  test('extracts @ mentions', () => {
    const html = '<action-text-attachment content-type="application/vnd.actiontext.mention"><img title="Wayne Smith"></action-text-attachment>';
    expect(htmlToText(html)).toBe('@Wayne Smith');
  });

  test('removes action-text-attachment tags', () => {
    const html = '<action-text-attachment sgid="abc123">file</action-text-attachment>';
    expect(htmlToText(html)).toBe('');
  });

  test('decodes HTML entities', () => {
    expect(htmlToText('&amp;')).toBe('&');
    expect(htmlToText('&lt;')).toBe('<');
    expect(htmlToText('&gt;')).toBe('>');
    expect(htmlToText('&quot;')).toBe('"');
    expect(htmlToText('&#39;')).toBe("'");
  });

  test('collapses multiple newlines', () => {
    const html = '<p>A</p>\n\n\n<p>B</p>';
    const result = htmlToText(html);
    // Should have at most 2 consecutive newlines
    expect(result.includes('\n\n\n')).toBe(false);
  });
});

describe('wrapText', () => {
  test('wraps long lines', () => {
    const text = 'This is a very long line that should be wrapped at the specified width';
    const result = wrapText(text, 30, '');
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(30);
    }
  });

  test('adds indent to each line', () => {
    const text = 'Line 1\nLine 2';
    const result = wrapText(text, 70, '  ');
    expect(result).toBe('  Line 1\n  Line 2');
  });

  test('handles empty string', () => {
    expect(wrapText('', 70, '')).toBe('');
  });
});
