// Mention resolution utilities
// Converts @Name patterns to Fizzy ActionText mention attachments

import type { FizzyClient } from '../client';

export interface Mentionable {
  name: string;
  firstName: string;
  sgid: string;
  avatarUrl: string;
  userId: string;
}

/**
 * Fetch mentionable users from the /prompts/users endpoint.
 * Returns HTML with <lexxy-prompt-item> elements containing sgid and search attributes.
 */
export async function fetchMentionableUsers(client: FizzyClient): Promise<Mentionable[]> {
  const html = await client.getHtml('/prompts/users');
  const mentionables: Mentionable[] = [];

  // Parse <lexxy-prompt-item search="Name Initials" sgid="..."> elements
  const itemRegex = /<lexxy-prompt-item[^>]*>/gi;
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const tag = match[0];

    const sgidMatch = tag.match(/sgid="([^"]+)"/);
    const searchMatch = tag.match(/search="([^"]+)"/);

    if (!sgidMatch || !searchMatch) continue;

    const sgid = sgidMatch[1];
    const search = searchMatch[1];

    // search is "Full Name Initials" — extract name (everything before last word which is initials)
    const parts = search.split(/\s+/);
    // Last part is initials (e.g., "WS"), rest is the name
    const name = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
    const firstName = parts[0];

    // Extract avatar URL from inner img tag if present
    const avatarRegex = new RegExp(
      `<lexxy-prompt-item[^>]*sgid="${sgid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<img[^>]*src="([^"]+)"`,
      'i'
    );
    const avatarMatch = html.match(avatarRegex);
    const avatarUrl = avatarMatch ? avatarMatch[1] : '';

    // Extract user ID from avatar URL (pattern: /ACCOUNT/users/USER_ID/avatar)
    const userIdMatch = avatarUrl.match(/\/users\/(\d+)\/avatar/);
    const userId = userIdMatch ? userIdMatch[1] : '';

    mentionables.push({ name, firstName, sgid, avatarUrl, userId });
  }

  return mentionables;
}

/**
 * Resolve @Name patterns in HTML to Fizzy mention attachments.
 *
 * Patterns:
 *   @firstName     — matches by first name (case-insensitive), skips if ambiguous
 *   @"Full Name"   — quoted, matches full name exactly
 *
 * Emails (user@example.com) are not treated as mentions.
 * Unresolved @Name stays as plain text with a warning to stderr.
 */
export function resolveMentions(html: string, mentionables: Mentionable[]): string {
  if (mentionables.length === 0) return html;

  // Collect all @mention matches with their positions, then replace from end to start
  interface MentionMatch {
    start: number;
    end: number;
    mentionable: Mentionable;
    original: string;
  }

  const matches: MentionMatch[] = [];

  // Pattern 1: @"Full Name" (quoted)
  const quotedRegex = /@"([^"]+)"/g;
  let m;
  while ((m = quotedRegex.exec(html)) !== null) {
    // Skip if inside an HTML tag
    if (isInsideTag(html, m.index)) continue;

    const fullName = m[1];
    const mentionable = mentionables.find(
      u => u.name.toLowerCase() === fullName.toLowerCase()
    );

    if (mentionable) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        mentionable,
        original: m[0],
      });
    } else {
      console.warn(`Warning: Could not resolve mention ${m[0]}`);
    }
  }

  // Pattern 2: @word (unquoted first name or full name)
  // Must NOT be preceded by a word character (to avoid matching emails like user@example.com)
  const unquotedRegex = /(?<![a-zA-Z0-9_.])@([a-zA-Z][a-zA-Z0-9_]*)/g;
  while ((m = unquotedRegex.exec(html)) !== null) {
    // Skip if inside an HTML tag
    if (isInsideTag(html, m.index)) continue;

    // Skip if this position already matched a quoted mention
    if (matches.some(existing => m!.index >= existing.start && m!.index < existing.end)) continue;

    const name = m[1];

    // Try exact first-name match (case-insensitive)
    const firstNameMatches = mentionables.filter(
      u => u.firstName.toLowerCase() === name.toLowerCase()
    );

    if (firstNameMatches.length === 1) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        mentionable: firstNameMatches[0],
        original: m[0],
      });
    } else if (firstNameMatches.length > 1) {
      console.warn(
        `Warning: Ambiguous mention ${m[0]} — matches: ${firstNameMatches.map(u => u.name).join(', ')}. Use @"Full Name" to disambiguate.`
      );
    } else {
      // Try full name match (single word matching first part)
      const fullNameMatch = mentionables.find(
        u => u.name.toLowerCase() === name.toLowerCase()
      );
      if (fullNameMatch) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          mentionable: fullNameMatch,
          original: m[0],
        });
      } else {
        console.warn(`Warning: Could not resolve mention ${m[0]}`);
      }
    }
  }

  // Sort matches by position descending so replacements don't shift indices
  matches.sort((a, b) => b.start - a.start);

  let result = html;
  for (const match of matches) {
    const mentionHtml = buildMentionHtml(match.mentionable);
    result = result.slice(0, match.start) + mentionHtml + result.slice(match.end);
  }

  return result;
}

/**
 * Check if a position in the string is inside an HTML tag (between < and >).
 */
function isInsideTag(html: string, pos: number): boolean {
  // Look backwards for < or >
  for (let i = pos - 1; i >= 0; i--) {
    if (html[i] === '>') return false;
    if (html[i] === '<') return true;
  }
  return false;
}

/**
 * Build the Fizzy mention HTML for a user.
 */
function buildMentionHtml(user: Mentionable): string {
  const avatarSrc = user.avatarUrl || `/${user.userId}/users/${user.userId}/avatar`;
  return (
    `<action-text-attachment sgid="${user.sgid}" content-type="application/vnd.actiontext.mention">` +
    `<img title="${user.name}" src="${avatarSrc}" width="48" height="48">` +
    `\n${user.firstName}` +
    `</action-text-attachment>`
  );
}
