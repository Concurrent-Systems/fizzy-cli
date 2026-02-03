// fizzy comments delete - Delete a comment

import type { FizzyClient } from '../../client';

export async function deleteComment(
  client: FizzyClient,
  cardNumber: string,
  commentId: string
): Promise<void> {
  console.log(`Deleting comment ${commentId} from card #${cardNumber}...`);

  await client.delete(`/cards/${cardNumber}/comments/${commentId}.json`);

  console.log('Comment deleted.');
}
