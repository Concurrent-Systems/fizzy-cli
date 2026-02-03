// fizzy cards update - Update a card

import { readFileSync } from 'fs';
import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';

interface UpdateOptions {
  title?: string;
  description?: string;
  file?: string;
}

export async function updateCard(
  client: FizzyClient,
  cardNumber: string,
  options: UpdateOptions = {}
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (options.title) {
    updates.title = options.title;
  }

  if (options.file) {
    const content = readFileSync(options.file, 'utf-8');
    updates.description = markdownToHtml(content);
  } else if (options.description) {
    updates.description = markdownToHtml(options.description);
  }

  if (Object.keys(updates).length === 0) {
    console.error('Error: No updates specified');
    console.error('Use --title, --description, or --file');
    process.exit(1);
  }

  console.log(`Updating card #${cardNumber}...`);

  await client.put(`/cards/${cardNumber}.json`, { card: updates });

  console.log('Card updated.');
}
