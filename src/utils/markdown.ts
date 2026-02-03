// Markdown to HTML conversion utilities
// Ported from fizzy-format.sh

/**
 * Convert Markdown-like syntax to Fizzy-supported HTML.
 *
 * Supported conversions:
 *   **bold**           -> <strong>bold</strong>
 *   *italic*           -> <em>italic</em>
 *   `code`             -> <code>code</code>
 *   # Heading          -> <h2>Heading</h2>
 *   ## Subhead         -> <h3>Subhead</h3>
 *   ### Sub-subhead    -> <h4>Sub-subhead</h4>
 *   - item             -> <ul><li>item</li></ul>
 *   1. item            -> <ol><li>item</li></ol>
 *   [text](url)        -> <a href="url">text</a>
 *   ---                -> <hr>
 *   Blank line         -> New <p>
 *
 * Special handling:
 *   Tables (| col |)   -> HTML table
 *   ```code blocks```  -> Inline code lines
 */
export function markdownToHtml(text: string): string {
  // Skip if already HTML (starts with HTML tag)
  if (text.trim().startsWith('<') && /^<[a-zA-Z]/.test(text.trim())) {
    return text;
  }

  let result = text;

  // 1. Code blocks first (before other processing)
  result = result.replace(/```\w*\n([\s\S]*?)```/g, (_, code: string) => {
    const lines = code.trim().split('\n');
    const codeLines = lines
      .filter((line: string) => line.trim())
      .map((line: string) => `<code>${escapeHtml(line)}</code>`);
    return codeLines.length ? `<p>${codeLines.join('<br>')}</p>` : '';
  });

  // 2. Tables
  result = result.replace(
    /^\|.*\|$(\n\|[-| ]+\|$)?(\n\|.*\|$)+/gm,
    convertTable
  );

  // 3. Inline formatting
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. Headings
  result = result.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  result = result.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  result = result.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // 5. Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 6. Horizontal rules
  result = result.replace(/^---$/gm, '<hr>');

  // 7. Convert bullet and numbered lists
  result = convertLists(result);

  // 8. Convert paragraphs (split on double newlines)
  const paragraphs = result.split(/\n\n+/);
  const htmlParts: string[] = [];

  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;

    // Do not wrap if already an HTML block element
    if (/^<(h[1-6]|ul|ol|hr|p|table)/.test(p)) {
      htmlParts.push(p);
    } else {
      // Convert single newlines to <br>
      p = p.replace(/\n/g, '<br>');
      htmlParts.push(`<p>${p}</p>`);
    }
  }

  return htmlParts.join('');
}

/**
 * Convert markdown tables to HTML tables
 */
function convertTable(match: string): string {
  const lines = match.trim().split('\n');
  if (lines.length < 3) return match;  // Need header, separator, at least one row

  const rows: string[] = [];

  for (let i = 2; i < lines.length; i++) {  // Skip header and separator
    const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
    if (!cells.some(c => c)) continue;

    const rowCells = cells.map((cell, j) => {
      if (j === 0) {
        return `<td><strong>${cell}</strong></td>`;
      }
      return `<td>${cell}</td>`;
    });
    rows.push(`<tr>${rowCells.join('')}</tr>`);
  }

  return rows.length ? `<table><tbody>${rows.join('')}</tbody></table>` : match;
}

/**
 * Convert markdown lists to HTML lists
 */
function convertLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const ulMatch = line.match(/^[-*] (.+)$/);
    const olMatch = line.match(/^(\d+)\. (.+)$/);

    if (ulMatch) {
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul>');
        inUl = true;
      }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        result.push('<ol>');
        inOl = true;
      }
      result.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      result.push(line);
    }
  }

  // Close any remaining open lists
  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
