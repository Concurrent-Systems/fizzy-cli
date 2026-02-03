// fizzy comment - Add a comment to a card

import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';

export async function addComment(
  client: FizzyClient,
  cardNumber: string,
  text: string
): Promise<void> {
  const body = markdownToHtml(text);

  console.log(`Adding comment to card #${cardNumber}...`);

  await client.post(`/cards/${cardNumber}/comments.json`, {
    comment: { body },
  });

  console.log('Comment added.');
}
