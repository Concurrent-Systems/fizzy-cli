// HTML to text conversion utilities
// Ported from fizzy-card.sh html_to_text function

/**
 * Convert HTML to readable plain text with proper spacing.
 * Handles Fizzy-specific elements like action-text-attachment.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';

  let text = html;

  // Add newlines before/after block elements
  text = text.replace(/<h[1-6][^>]*>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Handle ordered lists with numbers
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return '\n' + items.map((item: string, i: number) => {
      const inner = item.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '');
      return `  ${i + 1}. ${inner}`;
    }).join('\n') + '\n';
  });

  // Unordered lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '');
  text = text.replace(/<li[^>]*>/gi, '  * ');
  text = text.replace(/<\/li>/gi, '\n');

  // Inline formatting - keep content
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1');
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Handle @ mentions - extract name from nested img title
  text = text.replace(
    /<action-text-attachment[^>]*content-type="application\/vnd\.actiontext\.mention"[^>]*><img title="([^"]+)"[^>]*><\/action-text-attachment>/gi,
    '@$1'
  );

  // Remove any remaining action-text-attachment tags
  text = text.replace(/<action-text-attachment[^>]*>[\s\S]*?<\/action-text-attachment>/gi, '');

  // Remove any remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');  // Collapse multiple newlines to max 2
  text = text.replace(/[ \t]+/g, ' ');       // Collapse spaces

  return text.trim();
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '-',
    '&mdash;': '--',
    '&hellip;': '...',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return result;
}

/**
 * Wrap text to a specified width
 */
export function wrapText(text: string, width = 70, indent = '  '): string {
  const lines: string[] = [];

  for (const line of text.split('\n')) {
    if (line.length <= width) {
      lines.push(indent + line);
    } else {
      const words = line.split(' ');
      let current = '';
      for (const word of words) {
        if (current.length + word.length + 1 > width) {
          lines.push(indent + current.trim());
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      if (current) {
        lines.push(indent + current.trim());
      }
    }
  }

  return lines.join('\n');
}
