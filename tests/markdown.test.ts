import { describe, expect, test } from 'bun:test';
import { markdownToHtml } from '../src/utils/markdown';

describe('markdownToHtml', () => {
  test('skips text that is already HTML', () => {
    const html = '<p>Already HTML</p>';
    expect(markdownToHtml(html)).toBe(html);
  });

  test('converts bold text', () => {
    expect(markdownToHtml('**bold**')).toBe('<p><strong>bold</strong></p>');
  });

  test('converts italic text', () => {
    expect(markdownToHtml('*italic*')).toBe('<p><em>italic</em></p>');
  });

  test('converts inline code', () => {
    expect(markdownToHtml('`code`')).toBe('<p><code>code</code></p>');
  });

  test('converts headings', () => {
    expect(markdownToHtml('# Heading 1')).toBe('<h2>Heading 1</h2>');
    expect(markdownToHtml('## Heading 2')).toBe('<h3>Heading 2</h3>');
    expect(markdownToHtml('### Heading 3')).toBe('<h4>Heading 3</h4>');
  });

  test('converts links', () => {
    expect(markdownToHtml('[text](https://example.com)')).toBe('<p><a href="https://example.com">text</a></p>');
  });

  test('converts horizontal rules', () => {
    expect(markdownToHtml('---')).toBe('<hr>');
  });

  test('converts unordered lists', () => {
    const md = '- Item 1\n- Item 2';
    const result = markdownToHtml(md);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('</ul>');
  });

  test('converts ordered lists', () => {
    const md = '1. First\n2. Second';
    const result = markdownToHtml(md);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First</li>');
    expect(result).toContain('<li>Second</li>');
    expect(result).toContain('</ol>');
  });

  test('converts code blocks', () => {
    const md = '```js\nconst x = 1;\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('<code>');
    expect(result).toContain('const x = 1;');
  });

  test('wraps plain text in paragraphs', () => {
    expect(markdownToHtml('Plain text')).toBe('<p>Plain text</p>');
  });

  test('converts newlines to br within paragraphs', () => {
    expect(markdownToHtml('Line 1\nLine 2')).toBe('<p>Line 1<br>Line 2</p>');
  });

  test('handles multiple paragraphs', () => {
    const md = 'Para 1\n\nPara 2';
    const result = markdownToHtml(md);
    expect(result).toContain('<p>Para 1</p>');
    expect(result).toContain('<p>Para 2</p>');
  });

  test('converts tables to HTML', () => {
    const md = `| Col1 | Col2 |
|------|------|
| A    | B    |
| C    | D    |`;
    const result = markdownToHtml(md);
    expect(result).toContain('<table>');
    expect(result).toContain('<td>');
    expect(result).toContain('</table>');
  });

  test('handles mixed content', () => {
    const md = '# Title\n\nSome **bold** and *italic* text.\n\n- List item';
    const result = markdownToHtml(md);
    expect(result).toContain('<h2>Title</h2>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<li>List item</li>');
  });
});
