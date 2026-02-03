// fizzy cards delete - Delete a card

import type { FizzyClient } from '../../client';

export async function deleteCard(
  client: FizzyClient,
  cardNumber: string
): Promise<void> {
  console.log(`Deleting card #${cardNumber}...`);

  await client.delete(`/cards/${cardNumber}.json`);

  console.log('Card deleted.');
}
