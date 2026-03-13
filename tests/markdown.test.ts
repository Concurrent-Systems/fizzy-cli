import { describe, expect, test } from 'bun:test';
import { markdownToHtml } from '../src/utils/markdown';

describe('markdownToHtml', () => {
  test('skips text that is already HTML', () => {
    const html = '<p>Already HTML</p>';
    expect(markdownToHtml(html)).toBe(html);
  });

  test('converts bold text', () => {
    expect(markdownToHtml('**bold**')).toBe('<p><b><strong>bold</strong></b></p>');
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

  test('converts code blocks to pre+code', () => {
    const md = '```js\nconst x = 1;\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('<pre><code>const x = 1;</code></pre>');
  });

  test('code blocks preserve multiple lines', () => {
    const md = '```bash\necho hello\necho world\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('<pre><code>echo hello\necho world</code></pre>');
  });

  test('code blocks preserve blank lines', () => {
    const md = '```\nline 1\n\nline 3\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('<pre><code>line 1\n\nline 3</code></pre>');
  });

  test('code blocks escape HTML characters', () => {
    const md = '```\nif (a < b && c > d) {}\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
  });

  test('code blocks without language identifier', () => {
    const md = '```\nplain code\n```';
    const result = markdownToHtml(md);
    expect(result).toContain('<pre><code>plain code</code></pre>');
  });

  test('code blocks are not processed by inline formatting', () => {
    const md = '```\n**not bold** *not italic* `not inline`\n```';
    const result = markdownToHtml(md);
    // Content should be escaped, not formatted
    expect(result).not.toContain('<strong>');
    expect(result).not.toContain('<em>');
    expect(result).toContain('**not bold**');
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

  test('nests indented sub-lists inside parent li', () => {
    const md = '1. Parent item\n   - Child 1\n   - Child 2\n2. Next item';
    const result = markdownToHtml(md);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>Parent item');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Child 1</li>');
    expect(result).toContain('<li>Child 2</li>');
    expect(result).toContain('</ul>');
    expect(result).toContain('</li>');
    expect(result).toContain('<li>Next item</li>');
    // Nested <ul> must be inside the parent <li>, not a sibling
    expect(result).not.toContain('</li>\n<ul>');
  });

  test('star bullets are not consumed by italic regex', () => {
    const md = '* Item 1\n* Item 2';
    const result = markdownToHtml(md);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).not.toContain('<em>');
  });

  test('list without preceding blank line gets paragraph separation', () => {
    const md = 'Summary:\n- Item 1\n- Item 2';
    const result = markdownToHtml(md);
    expect(result).toContain('<p>Summary:</p>');
    expect(result).toContain('<li>Item 1</li>');
    // List must not be wrapped inside a <p>
    expect(result).not.toContain('<p><ul>');
    expect(result).not.toMatch(/<p>[^<]*<ul>/);
  });

  test('converts literal \\n to line break within a paragraph', () => {
    const result = markdownToHtml('Line one\\nLine two');
    expect(result).toBe('<p>Line one<br>Line two</p>');
  });

  test('converts literal \\n\\n to separate paragraphs', () => {
    const result = markdownToHtml('Line one\\n\\nLine two');
    expect(result).toContain('<p>Line one</p>');
    expect(result).toContain('<p>Line two</p>');
  });

  test('no spacer paragraph before or after lists', () => {
    const md = 'Heading:\n\n- Item 1\n- Item 2\n\nNext paragraph';
    const result = markdownToHtml(md);
    // No <p><br></p> between heading and list or between list and next para
    expect(result).not.toMatch(/<p><br><\/p><ul>/);
    expect(result).not.toMatch(/<\/ul><p><br><\/p>/);
  });

  test('blank lines between list items produce one list', () => {
    const md = '- Item 1\n\n- Item 2\n\n- Item 3';
    const result = markdownToHtml(md);
    const ulCount = (result.match(/<ul>/g) || []).length;
    expect(ulCount).toBe(1);
  });
});
