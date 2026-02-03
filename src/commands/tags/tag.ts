// fizzy tag / fizzy untag - Add or remove tags from a card

import type { FizzyClient } from '../../client';

export async function tagCard(
  client: FizzyClient,
  cardNumber: string,
  tagTitle: string
): Promise<void> {
  // Remove leading # if present
  const cleanTag = tagTitle.replace(/^#/, '');

  console.log(`Adding tag #${cleanTag} to card #${cardNumber}...`);

  await client.post(`/cards/${cardNumber}/taggings.json`, {
    tag_title: cleanTag,
  });

  console.log(`Tag #${cleanTag} added.`);
}

export async function untagCard(
  client: FizzyClient,
  cardNumber: string,
  tagTitle: string
): Promise<void> {
  // Remove leading # if present
  const cleanTag = tagTitle.replace(/^#/, '');

  // The taggings endpoint toggles, so calling it again removes the tag
  console.log(`Removing tag #${cleanTag} from card #${cardNumber}...`);

  await client.post(`/cards/${cardNumber}/taggings.json`, {
    tag_title: cleanTag,
  });

  console.log(`Tag #${cleanTag} removed.`);
}
