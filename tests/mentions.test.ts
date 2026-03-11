import { describe, expect, test, mock } from 'bun:test';
import { resolveMentions, type Mentionable } from '../src/utils/mentions';

const mentionables: Mentionable[] = [
  {
    name: 'Wayne Smith',
    firstName: 'Wayne',
    sgid: 'wayne-sgid-123',
    avatarUrl: '/6103476/users/1/avatar',
    userId: '1',
  },
  {
    name: 'Wahab Khurram',
    firstName: 'Wahab',
    sgid: 'wahab-sgid-456',
    avatarUrl: '/6103476/users/2/avatar',
    userId: '2',
  },
  {
    name: 'Faraz Ali',
    firstName: 'Faraz',
    sgid: 'faraz-sgid-789',
    avatarUrl: '/6103476/users/3/avatar',
    userId: '3',
  },
];

describe('resolveMentions', () => {
  test('@firstName resolves to mention HTML', () => {
    const html = '<p>Hey @Wayne, check this</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('sgid="wayne-sgid-123"');
    expect(result).toContain('content-type="application/vnd.actiontext.mention"');
    expect(result).toContain('title="Wayne Smith"');
    expect(result).not.toContain('@Wayne');
  });

  test('@"Full Name" resolves to mention HTML', () => {
    const html = '<p>Hey @"Wayne Smith", check this</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('sgid="wayne-sgid-123"');
    expect(result).toContain('title="Wayne Smith"');
    expect(result).not.toContain('@"Wayne Smith"');
  });

  test('multiple mentions in one string', () => {
    const html = '<p>@Wayne and @Wahab please review</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('sgid="wayne-sgid-123"');
    expect(result).toContain('sgid="wahab-sgid-456"');
    expect(result).not.toContain('@Wayne');
    expect(result).not.toContain('@Wahab');
  });

  test('unresolved @Unknown stays as plain text', () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (msg: string) => warnings.push(msg);

    const html = '<p>Hey @Unknown, check this</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('@Unknown');
    expect(result).not.toContain('action-text-attachment');
    expect(warnings.some(w => w.includes('@Unknown'))).toBe(true);

    console.warn = originalWarn;
  });

  test('email addresses are NOT treated as mentions', () => {
    const html = '<p>Email me at user@example.com</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toBe(html);
    expect(result).not.toContain('action-text-attachment');
  });

  test('case-insensitive matching', () => {
    const html = '<p>Hey @wayne, check this</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('sgid="wayne-sgid-123"');
  });

  test('ambiguous first name warns and skips', () => {
    const ambiguousMentionables: Mentionable[] = [
      ...mentionables,
      {
        name: 'Wayne Jones',
        firstName: 'Wayne',
        sgid: 'wayne2-sgid-999',
        avatarUrl: '/6103476/users/99/avatar',
        userId: '99',
      },
    ];

    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (msg: string) => warnings.push(msg);

    const html = '<p>Hey @Wayne, check this</p>';
    const result = resolveMentions(html, ambiguousMentionables);
    // Should NOT replace — ambiguous
    expect(result).toContain('@Wayne');
    expect(result).not.toContain('action-text-attachment');
    expect(warnings.some(w => w.includes('Ambiguous'))).toBe(true);

    console.warn = originalWarn;
  });

  test('ambiguous first name can be resolved with @"Full Name"', () => {
    const ambiguousMentionables: Mentionable[] = [
      ...mentionables,
      {
        name: 'Wayne Jones',
        firstName: 'Wayne',
        sgid: 'wayne2-sgid-999',
        avatarUrl: '/6103476/users/99/avatar',
        userId: '99',
      },
    ];

    const html = '<p>Hey @"Wayne Smith", check this</p>';
    const result = resolveMentions(html, ambiguousMentionables);
    expect(result).toContain('sgid="wayne-sgid-123"');
    expect(result).not.toContain('wayne2-sgid-999');
  });

  test('@ inside HTML tags is not treated as a mention', () => {
    const html = '<a href="mailto:user@example.com">contact</a>';
    const result = resolveMentions(html, mentionables);
    expect(result).toBe(html);
  });

  test('empty mentionables returns html unchanged', () => {
    const html = '<p>@Wayne test</p>';
    const result = resolveMentions(html, []);
    expect(result).toBe(html);
  });

  test('mention HTML includes avatar img with correct attributes', () => {
    const html = '<p>@Wayne</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('src="/6103476/users/1/avatar"');
    expect(result).toContain('width="48"');
    expect(result).toContain('height="48"');
  });

  test('mention at start of paragraph', () => {
    const html = '<p>@Faraz please look at this</p>';
    const result = resolveMentions(html, mentionables);
    expect(result).toContain('sgid="faraz-sgid-789"');
    expect(result).toContain('title="Faraz Ali"');
  });
});
