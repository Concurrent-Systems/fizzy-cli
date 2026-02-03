// fizzy steps add - Add a step to a card

import type { FizzyClient } from '../../client';

export async function addStep(
  client: FizzyClient,
  cardNumber: string,
  content: string
): Promise<void> {
  console.log(`Adding step to card #${cardNumber}: ${content}`);

  await client.post(`/cards/${cardNumber}/steps.json`, {
    step: { content },
  });

  console.log('Step added.');
}
