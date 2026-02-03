// fizzy card NUM - Show a card with description, steps, and comments

import type { FizzyClient } from '../../client';
import type { Card, Comment } from '../../types/api';
import { htmlToText, wrapText } from '../../utils/html';

interface ShowOptions {
  verbose?: boolean;
}

export async function showCard(
  client: FizzyClient,
  cardNumber: string,
  options: ShowOptions = {}
): Promise<void> {
  // Fetch card
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);

  // Fetch all comments (paginated)
  const comments = await client.getAll<Comment>(`/cards/${cardNumber}/comments.json`);

  // Header
  console.log('='.repeat(60));
  console.log(`Card #${card.number}: ${card.title}`);
  console.log('='.repeat(60));
  console.log('');

  // Meta
  const board = card.board?.name || '?';
  const column = card.column?.name || '-';
  const creator = card.creator?.name || '?';
  console.log(`Board:   ${board}`);
  console.log(`Column:  ${column}`);
  console.log(`Creator: ${creator}`);
  console.log(`URL:     ${card.url}`);
  console.log('');

  // Tags
  if (card.tags && card.tags.length > 0) {
    console.log(`Tags:    ${card.tags.map(t => `#${t}`).join(' ')}`);
    console.log('');
  }

  // Description
  if (card.description_html) {
    const desc = htmlToText(card.description_html);
    if (desc) {
      console.log('Description:');
      console.log('-'.repeat(40));
      console.log(wrapText(desc, 70, '  '));
      console.log('');
    }
  }

  // Steps (checklist)
  if (card.steps && card.steps.length > 0) {
    console.log('Checklist:');
    console.log('-'.repeat(40));
    for (const step of card.steps) {
      const status = step.completed ? '[x]' : '[ ]';
      console.log(`  ${status} ${step.content}`);
    }
    const completed = card.steps.filter(s => s.completed).length;
    console.log(`  (${completed}/${card.steps.length} completed)`);
    console.log('');
  }

  // Comments (skip system messages, show last 10)
  const userComments = comments.filter(c => c.creator?.role !== 'system');
  if (userComments.length > 0) {
    console.log('Comments:');
    console.log('-'.repeat(40));

    const recentComments = userComments.slice(-10);
    for (const comment of recentComments) {
      const author = comment.creator?.name || '?';
      const date = comment.created_at.substring(0, 10);
      const text = htmlToText(comment.body.html || comment.body.plain_text);

      if (options.verbose) {
        console.log(`  [${date}] ${author} (ID: ${comment.id}):`);
      } else {
        console.log(`  [${date}] ${author}:`);
      }

      for (const line of text.split('\n')) {
        console.log(`    ${line}`);
      }
      console.log('');
    }

    if (userComments.length > 10) {
      console.log(`  ... and ${userComments.length - 10} earlier comments`);
      console.log('');
    }
  }

  // Activity summary (system messages)
  const systemComments = comments.filter(c => c.creator?.role === 'system');
  if (systemComments.length > 0) {
    console.log(`Activity: ${systemComments.length} system events`);
    // Show last 3
    for (const c of systemComments.slice(-3)) {
      const text = c.body.plain_text || htmlToText(c.body.html);
      console.log(`  * ${text}`);
    }
    console.log('');
  }
}
