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
  // The API returns: <action-text-attachment ...><img title="Full Name" ...>\nFirstName</action-text-attachment>
  text = text.replace(
    /<action-text-attachment[^>]*content-type="application\/vnd\.actiontext\.mention"[^>]*><img title="([^"]+)"[^>]*>[\s\S]*?<\/action-text-attachment>/gi,
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

/**
 * Attachment metadata extracted from HTML
 */
export interface Attachment {
  filename: string;
  url: string;        // relative path: /6103476/rails/active_storage/blobs/redirect/...
  size: string;       // human readable: "28.6 MB"
  contentType: string;
}

/**
 * Extract attachments from HTML content.
 * Parses <action-text-attachment> elements that contain file attachments.
 */
export function extractAttachments(html: string | null | undefined): Attachment[] {
  if (!html) return [];

  const attachments: Attachment[] = [];

  // Match action-text-attachment elements (excluding mentions which have different content-type)
  // Pattern: <action-text-attachment ... filename="..." ...>...<a ... href="...">...</a>...</action-text-attachment>
  const attachmentRegex = /<action-text-attachment[^>]*(?<!content-type="application\/vnd\.actiontext\.mention")[^>]*>([\s\S]*?)<\/action-text-attachment>/gi;

  let match;
  while ((match = attachmentRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const innerContent = match[1];

    // Skip mentions (they have a specific content-type)
    if (fullTag.includes('content-type="application/vnd.actiontext.mention"')) {
      continue;
    }

    // Extract filename from attribute
    const filenameMatch = fullTag.match(/filename="([^"]+)"/);
    const filename = filenameMatch ? decodeHtmlEntities(filenameMatch[1]) : '';

    // Extract content-type from attribute
    const contentTypeMatch = fullTag.match(/content-type="([^"]+)"/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';

    // Extract filesize from attribute (or from span if not in attribute)
    let size = '';
    const filesizeAttrMatch = fullTag.match(/filesize="([^"]+)"/);
    if (filesizeAttrMatch) {
      // Convert bytes to human readable
      const bytes = parseInt(filesizeAttrMatch[1], 10);
      size = formatFileSize(bytes);
    } else {
      // Try to find size in span
      const sizeSpanMatch = innerContent.match(/<span[^>]*class="[^"]*attachment__size[^"]*"[^>]*>([^<]+)<\/span>/i);
      if (sizeSpanMatch) {
        size = sizeSpanMatch[1].trim();
      }
    }

    // Extract href from inner <a> tag
    const hrefMatch = innerContent.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
    const url = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : '';

    // Only add if we have both filename and URL
    if (filename && url) {
      attachments.push({ filename, url, size, contentType });
    }
  }

  return attachments;
}

/**
 * Format bytes into human-readable size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
