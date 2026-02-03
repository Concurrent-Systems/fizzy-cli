// fizzy comments edit - Edit a comment

import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';

export async function editComment(
  client: FizzyClient,
  cardNumber: string,
  commentId: string,
  text: string
): Promise<void> {
  const body = markdownToHtml(text);

  console.log(`Editing comment ${commentId} on card #${cardNumber}...`);

  await client.put(`/cards/${cardNumber}/comments/${commentId}.json`, {
    comment: { body },
  });

  console.log('Comment updated.');
}
