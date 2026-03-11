// fizzy comment - Add a comment to a card

import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';
import { fetchMentionableUsers, resolveMentions } from '../../utils/mentions';

export async function addComment(
  client: FizzyClient,
  cardNumber: string,
  text: string
): Promise<void> {
  let body = markdownToHtml(text);
  if (text.includes('@')) {
    const mentionables = await fetchMentionableUsers(client);
    body = resolveMentions(body, mentionables);
  }

  console.log(`Adding comment to card #${cardNumber}...`);

  await client.post(`/cards/${cardNumber}/comments.json`, {
    comment: { body },
  });

  console.log('Comment added.');
}
