// fizzy boards - List all boards

import type { FizzyClient } from '../../client';
import type { Board } from '../../types/api';

export async function listBoards(client: FizzyClient): Promise<void> {
  console.log(`Boards in account ${client.accountId}:`);
  console.log('======================================');
  console.log('');

  const boards = await client.getAll<Board>('/boards.json');

  if (boards.length === 0) {
    console.log('No boards found.');
    return;
  }

  for (const board of boards) {
    console.log(board.name);
    console.log(`  ID:  ${board.id}`);
    console.log(`  URL: ${board.url}`);
    console.log('');
  }

  console.log(`Total: ${boards.length} boards`);
}
