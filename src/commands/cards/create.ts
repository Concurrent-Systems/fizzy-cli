// fizzy cards create - Create a new card

import { readFileSync } from 'fs';
import type { FizzyClient } from '../../client';
import type { Board, Tag } from '../../types/api';
import { markdownToHtml } from '../../utils/markdown';

interface CreateOptions {
  board?: string;
  description?: string;
  file?: string;
  tags?: string[];
  draft?: boolean;
}

export async function createCard(
  client: FizzyClient,
  title: string,
  options: CreateOptions = {}
): Promise<void> {
  // Find board
  if (!options.board) {
    console.error('Error: Board is required (--board)');
    process.exit(1);
  }

  const boards = await client.getAll<Board>('/boards.json');
  const board = boards.find(
    b => b.id === options.board || b.name.toLowerCase() === options.board?.toLowerCase()
  );

  if (!board) {
    console.error(`Board not found: ${options.board}`);
    console.error('');
    console.error('Available boards:');
    for (const b of boards) {
      console.error(`  - ${b.name}`);
    }
    process.exit(1);
  }

  // Get description
  let description: string | undefined;
  if (options.file) {
    const content = readFileSync(options.file, 'utf-8');
    description = markdownToHtml(content);
  } else if (options.description) {
    description = markdownToHtml(options.description);
  }

  // Resolve tags
  let tagIds: string[] | undefined;
  if (options.tags && options.tags.length > 0) {
    const allTags = await client.getAll<Tag>('/tags.json');
    tagIds = [];
    for (const tagName of options.tags) {
      const tag = allTags.find(
        t => t.id === tagName || t.title.toLowerCase() === tagName.toLowerCase()
      );
      if (tag) {
        tagIds.push(tag.id);
      } else {
        console.warn(`Warning: Tag not found: ${tagName}`);
      }
    }
  }

  console.log(`Creating card on "${board.name}": ${title}`);

  await client.post(`/boards/${board.id}/cards.json`, {
    card: {
      title,
      ...(description && { description }),
      ...(tagIds && { tag_ids: tagIds }),
      status: options.draft ? 'drafted' : 'published',
    },
  });

  console.log('Card created.');
}
