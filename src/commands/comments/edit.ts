// fizzy comments edit - Edit a comment

import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';
import { fetchMentionableUsers, resolveMentions } from '../../utils/mentions';

export async function editComment(
  client: FizzyClient,
  cardNumber: string,
  commentId: string,
  text: string
): Promise<void> {
  let body = markdownToHtml(text);
  if (text.includes('@')) {
    const mentionables = await fetchMentionableUsers(client);
    body = resolveMentions(body, mentionables);
  }

  console.log(`Editing comment ${commentId} on card #${cardNumber}...`);

  await client.put(`/cards/${cardNumber}/comments/${commentId}.json`, {
    comment: { body },
  });

  console.log('Comment updated.');
}
