// Markdown to HTML conversion utilities
// Converts markdown to Fizzy-compatible HTML

/**
 * Convert Markdown-like syntax to Fizzy-supported HTML.
 *
 * Supported conversions:
 *   **bold**           -> <b><strong>bold</strong></b>
 *   *italic*           -> <em>italic</em>
 *   `code`             -> <code>code</code>
 *   # Heading          -> <h2>Heading</h2>
 *   ## Subhead         -> <h3>Subhead</h3>
 *   ### Sub-subhead    -> <h4>Sub-subhead</h4>
 *   - item             -> <ul><li>item</li></ul>
 *   1. item            -> <ol><li>item</li></ol>
 *   [text](url)        -> <a href="url">text</a>
 *   ---                -> <hr>
 *   Blank line         -> New <p> with spacing
 *
 * Special handling:
 *   Tables (| col |)   -> Fizzy-style table with figure wrapper
 *   ```code blocks```  -> <pre><code>code blocks</code></pre>
 */
export function markdownToHtml(text: string): string {
  // Skip if already HTML (starts with HTML tag)
  if (text.trim().startsWith('<') && /^<[a-zA-Z]/.test(text.trim())) {
    return text;
  }

  let result = text;

  // Normalize line endings
  result = result.replace(/\r\n/g, '\n');

  // Convert literal \n sequences to actual newlines (common in CLI input)
  result = result.replace(/\\n/g, '\n');

  // 1. Extract code blocks before other processing to protect their content
  const codeBlocks: string[] = [];
  result = result.replace(/```\w*\n([\s\S]*?)```/g, (_, code: string) => {
    const trimmed = code.replace(/\n$/, '');
    if (!trimmed) return '';
    const placeholder = `\n\n%%CODEBLOCK_${codeBlocks.length}%%\n\n`;
    codeBlocks.push(`<pre><code>${escapeHtml(trimmed)}</code></pre>`);
    return placeholder;
  });

  // 2. Tables - convert to Fizzy-style tables
  result = result.replace(
    /^\|.+\|[ \t]*$(\n\|[-| :]+\|[ \t]*$)?(\n\|.+\|[ \t]*$)+/gm,
    convertTable
  );

  // 3. Convert bullet and numbered lists (before inline formatting so
  //    * bullets aren't consumed by the italic regex)
  result = convertLists(result);

  // 4. Inline formatting (order matters: bold before italic)
  result = result.replace(/\*\*(.+?)\*\*/g, '<b><strong>$1</strong></b>');
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 5. Headings (must be at start of line)
  result = result.replace(/^### (.+)$/gm, '\n\n<h4>$1</h4>\n\n');
  result = result.replace(/^## (.+)$/gm, '\n\n<h3>$1</h3>\n\n');
  result = result.replace(/^# (.+)$/gm, '\n\n<h2>$1</h2>\n\n');

  // 6. Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 7. Horizontal rules
  result = result.replace(/^---+$/gm, '\n\n<hr>\n\n');

  // 8. Convert paragraphs
  result = convertParagraphs(result);

  // 9. Reinsert code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    result = result.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
  }

  return result;
}

/**
 * Convert markdown tables to Fizzy-style HTML tables.
 * Fizzy wraps tables in <figure> and uses <p><b><strong> in cells.
 */
function convertTable(match: string): string {
  const lines = match.trim().split('\n');
  if (lines.length < 2) return match;

  // Find separator line (contains only |, -, :, and spaces)
  let separatorIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\|[\s\-:|]+\|$/.test(lines[i].trim())) {
      separatorIdx = i;
      break;
    }
  }

  // Header row (before separator, or first line if no separator)
  const headerIdx = separatorIdx > 0 ? separatorIdx - 1 : 0;
  const dataStartIdx = separatorIdx >= 0 ? separatorIdx + 1 : 1;

  // Parse header cells
  const headerCells = parseCells(lines[headerIdx]);
  const headerHtml = headerCells
    .map(cell => `<th><p><b><strong>${cell}</strong></b></p></th>`)
    .join('');

  // Parse data rows
  const rows: string[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    // Skip separator-like lines
    if (/^\|[\s\-:|]+\|$/.test(lines[i].trim())) continue;

    const cells = parseCells(lines[i]);
    if (!cells.some(c => c)) continue;

    const rowCells = cells.map((cell, idx) => {
      // First column gets bold treatment
      if (idx === 0) {
        return `<td><p><b><strong>${cell}</strong></b></p></td>`;
      }
      return `<td><p>${cell}</p></td>`;
    });
    rows.push(`<tr>${rowCells.join('')}</tr>`);
  }

  if (rows.length === 0) return match;

  // Wrap in figure like Fizzy does
  return `\n\n<figure class="lexxy-content__table-wrapper"><table><thead><tr>${headerHtml}</tr></thead><tbody>${rows.join('')}</tbody></table></figure>\n\n`;
}

/**
 * Parse table cells from a pipe-delimited line
 */
function parseCells(line: string): string[] {
  // Remove leading/trailing pipes and split
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return trimmed.split('|').map(c => c.trim());
  }
  return trimmed.slice(1, -1).split('|').map(c => c.trim());
}

/**
 * Parse a line as a list item, returning indent, type, and content.
 */
function parseListItem(line: string): { indent: number; type: 'ul' | 'ol'; content: string } | null {
  const ulMatch = line.match(/^([ ]*)([-*+]) (.+)$/);
  if (ulMatch) return { indent: ulMatch[1].length, type: 'ul', content: ulMatch[3] };
  const olMatch = line.match(/^([ ]*)(\d+)[.)]\s+(.+)$/);
  if (olMatch) return { indent: olMatch[1].length, type: 'ol', content: olMatch[3] };
  return null;
}

/**
 * Convert markdown lists to HTML lists.
 * Supports one level of nesting (indented sub-lists inside <li>).
 * Inserts blank lines around list blocks so convertParagraphs treats
 * them as separate blocks. Blank lines between items don't break the list.
 */
function convertLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let topList: 'ul' | 'ol' | null = null;
  let topIndent = 0;
  let nestedList: 'ul' | 'ol' | null = null;

  function closeNested() {
    if (nestedList) {
      result.push(`</${nestedList}>`);
      result.push('</li>');
      nestedList = null;
    }
  }

  function closeAll() {
    closeNested();
    if (topList) {
      result.push(`</${topList}>`);
      result.push('');
      topList = null;
    }
  }

  for (const line of lines) {
    const item = parseListItem(line);

    if (item) {
      if (!topList) {
        // Starting a new top-level list
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('');
        }
        result.push(`<${item.type}>`);
        topList = item.type;
        topIndent = item.indent;
        result.push(`<li>${item.content}</li>`);
      } else if (item.indent <= topIndent + 1) {
        // Same level as top list
        closeNested();
        if (topList !== item.type) {
          result.push(`</${topList}>`);
          result.push('');
          result.push(`<${item.type}>`);
          topList = item.type;
        }
        result.push(`<li>${item.content}</li>`);
      } else {
        // Deeper indent — nested list inside the last <li>
        if (!nestedList) {
          const lastIdx = result.length - 1;
          if (result[lastIdx].endsWith('</li>')) {
            result[lastIdx] = result[lastIdx].slice(0, -5);
          }
          result.push(`<${item.type}>`);
          nestedList = item.type;
        } else if (nestedList !== item.type) {
          result.push(`</${nestedList}>`);
          result.push(`<${item.type}>`);
          nestedList = item.type;
        }
        result.push(`<li>${item.content}</li>`);
      }
    } else if (line.trim() === '' && topList) {
      // Blank lines within a list — keep it open
      continue;
    } else {
      // Non-list line — close everything
      closeAll();
      result.push(line);
    }
  }

  // Close any remaining open lists
  closeNested();
  if (topList) result.push(`</${topList}>`);

  return result.join('\n');
}

/**
 * Convert text blocks to paragraphs with proper spacing.
 * Adds visual spacing between block elements.
 */
function convertParagraphs(text: string): string {
  // Split on double+ newlines (paragraph breaks)
  const blocks = text.split(/\n{2,}/);
  const htmlParts: string[] = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // Check if already a block element or a code block placeholder
    if (/^<(h[1-6]|ul|ol|hr|p|table|figure|pre)/.test(block) || /^%%CODEBLOCK_\d+%%$/.test(block)) {
      htmlParts.push(block);
    } else {
      // Convert single newlines within paragraph to <br>
      block = block.replace(/\n/g, '<br>');
      htmlParts.push(`<p>${block}</p>`);
    }
  }

  // Join blocks with spacing - add blank paragraph between content blocks
  // but not around structural elements like hr
  const result: string[] = [];
  for (let i = 0; i < htmlParts.length; i++) {
    result.push(htmlParts[i]);

    // Add spacing after this block if there's another block coming
    // and neither is a horizontal rule
    if (i < htmlParts.length - 1) {
      const current = htmlParts[i];
      const next = htmlParts[i + 1];

      // Skip spacing around <hr> elements
      if (!current.startsWith('<hr') && !next.startsWith('<hr')) {
        result.push('<p><br></p>');
      }
    }
  }

  return result.join('');
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
