// fizzy done / fizzy reopen - Close/reopen a card

import type { FizzyClient } from '../../client';

export async function closeCard(
  client: FizzyClient,
  cardNumber: string
): Promise<void> {
  console.log(`Closing card #${cardNumber}...`);

  await client.post(`/cards/${cardNumber}/closure.json`, {});

  console.log('Card closed.');
}

export async function reopenCard(
  client: FizzyClient,
  cardNumber: string
): Promise<void> {
  console.log(`Reopening card #${cardNumber}...`);

  await client.delete(`/cards/${cardNumber}/closure.json`);

  console.log('Card reopened.');
}
