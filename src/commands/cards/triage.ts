// fizzy cards triage - Move a card to/from triage or to a column

import type { FizzyClient } from '../../client';
import type { Board, Card, Column } from '../../types/api';

export async function triageCard(
  client: FizzyClient,
  cardNumber: string,
  columnName?: string
): Promise<void> {
  // Get the card first to find its board
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);

  if (!columnName) {
    // Send back to triage
    console.log(`Sending card #${cardNumber} back to triage...`);
    await client.delete(`/cards/${cardNumber}/triage.json`);
    console.log('Card moved to triage.');
    return;
  }

  // Find the column on the card's board
  const columns = await client.getAll<Column>(`/boards/${card.board.id}/columns.json`);
  const column = columns.find(
    c => c.id === columnName || c.name.toLowerCase() === columnName.toLowerCase()
  );

  if (!column) {
    console.error(`Column not found: ${columnName}`);
    console.error('');
    console.error(`Columns on "${card.board.name}":`);
    for (const c of columns) {
      console.error(`  - ${c.name}`);
    }
    process.exit(1);
  }

  console.log(`Moving card #${cardNumber} to column "${column.name}"...`);

  await client.post(`/cards/${cardNumber}/triage.json`, {
    column_id: column.id,
  });

  console.log('Card moved.');
}
