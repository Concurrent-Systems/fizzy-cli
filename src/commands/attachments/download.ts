// fizzy download - Download attachments from a card

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import type { FizzyClient } from '../../client';
import type { Card, Comment } from '../../types/api';
import { extractAttachments, type Attachment } from '../../utils/html';

interface DownloadOptions {
  output?: string;
  list?: boolean;
}

/**
 * Download attachments from a card
 */
export async function downloadAttachments(
  client: FizzyClient,
  cardNumber: string,
  filename?: string,
  options: DownloadOptions = {}
): Promise<void> {
  // Fetch card and comments
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);
  const comments = await client.getAll<Comment>(`/cards/${cardNumber}/comments.json`);

  // Collect all attachments from description and comments
  const allAttachments: { attachment: Attachment; source: string }[] = [];

  // From card description
  const descAttachments = extractAttachments(card.description_html);
  for (const att of descAttachments) {
    allAttachments.push({ attachment: att, source: 'description' });
  }

  // From comments
  for (const comment of comments) {
    const commentAttachments = extractAttachments(comment.body.html);
    for (const att of commentAttachments) {
      const author = comment.creator?.name || 'unknown';
      const date = comment.created_at.substring(0, 10);
      allAttachments.push({ attachment: att, source: `${author} (${date})` });
    }
  }

  if (allAttachments.length === 0) {
    console.log(`No attachments found on card #${cardNumber}`);
    return;
  }

  // List mode - just show attachments
  if (options.list) {
    console.log(`Attachments on card #${cardNumber}:`);
    console.log('');
    for (const { attachment, source } of allAttachments) {
      const size = attachment.size ? ` (${attachment.size})` : '';
      console.log(`  ${attachment.filename}${size}`);
      console.log(`    Source: ${source}`);
      console.log(`    Type: ${attachment.contentType}`);
      console.log('');
    }
    console.log(`Total: ${allAttachments.length} attachment(s)`);
    return;
  }

  // Filter by filename if specified
  let toDownload = allAttachments;
  if (filename) {
    toDownload = allAttachments.filter(
      ({ attachment }) => attachment.filename === filename ||
        attachment.filename.toLowerCase().includes(filename.toLowerCase())
    );
    if (toDownload.length === 0) {
      console.error(`No attachment matching "${filename}" found`);
      console.log('Use --list to see available attachments');
      process.exit(1);
    }
  }

  // Resolve output directory
  const outputDir = resolve(options.output || '.');
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  // Download each attachment
  console.log(`Downloading ${toDownload.length} attachment(s) to ${outputDir}...`);
  console.log('');

  for (const { attachment, source } of toDownload) {
    const outputPath = join(outputDir, attachment.filename);
    console.log(`  ${attachment.filename}`);

    try {
      const data = await client.downloadFile(attachment.url);
      await writeFile(outputPath, data);
      const size = attachment.size ? ` (${attachment.size})` : '';
      console.log(`    ✓ Saved${size}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`    ✗ Failed: ${message}`);
    }
  }

  console.log('');
  console.log('Done');
}
