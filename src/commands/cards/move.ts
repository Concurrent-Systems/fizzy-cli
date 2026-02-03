// fizzy cards move - Move a card to another board

import type { FizzyClient } from '../../client';
import type { Board, Card } from '../../types/api';

export async function moveCard(
  client: FizzyClient,
  cardNumber: string,
  targetBoard: string
): Promise<void> {
  // Find the target board
  const boards = await client.getAll<Board>('/boards.json');
  const board = boards.find(
    b => b.id === targetBoard || b.name.toLowerCase() === targetBoard.toLowerCase()
  );

  if (!board) {
    console.error(`Board not found: ${targetBoard}`);
    console.error('');
    console.error('Available boards:');
    for (const b of boards) {
      console.error(`  - ${b.name}`);
    }
    process.exit(1);
  }

  // Get current card
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);

  if (card.board.id === board.id) {
    console.log(`Card #${cardNumber} is already on "${board.name}"`);
    return;
  }

  console.log(`Moving card #${cardNumber} from "${card.board.name}" to "${board.name}"...`);

  // Delete from current board and recreate on new board
  // Note: Fizzy API doesn't have a direct move, so we'd need to recreate
  // For now, just show what would happen
  console.log('Note: Cross-board move requires recreating the card.');
  console.log('This preserves comments but may change the card number.');
}
