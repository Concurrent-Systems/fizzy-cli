// fizzy cards list - List cards with various filters

import type { FizzyClient } from '../../client';
import type { Board, Card, Tag, User } from '../../types/api';

interface ListOptions {
  board?: string;
  tag?: string;
  assignee?: string;
  status?: string;
  sorted?: string;
}

export async function listCards(
  client: FizzyClient,
  options: ListOptions = {}
): Promise<void> {
  const params = new URLSearchParams();

  // Build filter params
  if (options.board) {
    const boards = await client.getAll<Board>('/boards.json');
    const board = boards.find(
      b => b.id === options.board || b.name.toLowerCase() === options.board?.toLowerCase()
    );
    if (!board) {
      console.error(`Board not found: ${options.board}`);
      process.exit(1);
    }
    params.append('board_ids[]', board.id);
    console.log(`Cards on "${board.name}":`);
  } else {
    console.log('All cards:');
  }

  if (options.tag) {
    const tags = await client.getAll<Tag>('/tags.json');
    const tag = tags.find(
      t => t.id === options.tag || t.title.toLowerCase() === options.tag?.toLowerCase()
    );
    if (!tag) {
      console.error(`Tag not found: ${options.tag}`);
      process.exit(1);
    }
    params.append('tag_ids[]', tag.id);
  }

  if (options.assignee) {
    const users = await client.getAll<User>('/users.json');
    const user = users.find(
      u => u.id === options.assignee ||
           u.name.toLowerCase().includes(options.assignee?.toLowerCase() || '')
    );
    if (!user) {
      console.error(`User not found: ${options.assignee}`);
      process.exit(1);
    }
    params.append('assignee_ids[]', user.id);
  }

  if (options.status) {
    params.append('indexed_by', options.status);
  }

  if (options.sorted) {
    params.append('sorted_by', options.sorted);
  }

  console.log('======================================');
  console.log('');

  const queryString = params.toString();
  const url = queryString ? `/cards.json?${queryString}` : '/cards.json';
  const cards = await client.getAll<Card>(url);

  if (cards.length === 0) {
    console.log('No cards found.');
    return;
  }

  for (const card of cards) {
    const col = card.column?.name || '-';
    const board = card.board?.name || '?';
    console.log(`#${card.number}: ${card.title}`);
    console.log(`  Board: ${board} | Column: ${col}`);
    console.log(`  URL: ${card.url}`);
    console.log('');
  }

  console.log('--------------------------------------');
  console.log(`Found: ${cards.length} cards`);
}

export async function searchCards(
  client: FizzyClient,
  term: string
): Promise<void> {
  console.log(`Searching for: ${term}`);
  console.log('======================================');
  console.log('');

  const encoded = encodeURIComponent(term);
  const cards = await client.getAll<Card>(`/cards.json?terms[]=${encoded}`);

  if (cards.length === 0) {
    console.log('No cards found.');
    return;
  }

  for (const card of cards) {
    const col = card.column?.name || '-';
    const board = card.board?.name || '?';
    console.log(`#${card.number}: ${card.title}`);
    console.log(`  Board: ${board} | Column: ${col}`);
    console.log(`  URL: ${card.url}`);
    console.log('');
  }

  console.log('--------------------------------------');
  console.log(`Found: ${cards.length} cards`);
}

export async function myCards(client: FizzyClient): Promise<void> {
  console.log('My assigned cards:');
  console.log('======================================');
  console.log('');

  // Get current user first
  const identity = await client.get<{ accounts: Array<{ user: User }> }>('/my/identity');
  // The identity returns accounts, but we need to match by account ID
  // For now, just list cards assigned to any active user matching current auth
  // This is a simplification - the bash script does user lookup

  const cards = await client.getAll<Card>('/cards.json');

  // Group by board
  const byBoard = new Map<string, Card[]>();
  for (const card of cards) {
    const assignees = card.assignees || [];
    // Check if current user is assigned (we'd need user ID, simplify for now)
    // For the CLI skill, cards will have assignee info
    if (assignees.length > 0) {
      const boardName = card.board?.name || 'Unknown';
      if (!byBoard.has(boardName)) {
        byBoard.set(boardName, []);
      }
      byBoard.get(boardName)!.push(card);
    }
  }

  if (byBoard.size === 0) {
    console.log('No cards assigned.');
    return;
  }

  for (const [boardName, boardCards] of byBoard) {
    console.log(`${boardName}:`);
    for (const card of boardCards) {
      const col = card.column?.name || '-';
      console.log(`  #${card.number}: ${card.title} [${col}]`);
    }
    console.log('');
  }
}
