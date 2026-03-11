// fizzy steps check - Toggle step completion

import type { FizzyClient } from '../../client';
import type { Card, Step } from '../../types/api';

export async function checkStep(
  client: FizzyClient,
  cardNumber: string,
  stepIdentifier: string,
  completed?: boolean
): Promise<void> {
  // Get the card to find steps
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);

  if (!card.steps || card.steps.length === 0) {
    console.error(`Card #${cardNumber} has no steps.`);
    process.exit(1);
  }

  // Find step by ID or index (1-based) or content substring
  let step: Step | undefined;
  const index = parseInt(stepIdentifier, 10);

  if (!isNaN(index) && index > 0 && index <= card.steps.length) {
    // Index-based lookup (1-based)
    step = card.steps[index - 1];
  } else {
    // ID or content lookup
    step = card.steps.find(
      s => s.id === stepIdentifier ||
           s.content.toLowerCase().includes(stepIdentifier.toLowerCase())
    );
  }

  if (!step) {
    console.error(`Step not found: ${stepIdentifier}`);
    console.error('');
    console.error('Available steps:');
    card.steps.forEach((s, i) => {
      const status = s.completed ? '[x]' : '[ ]';
      console.error(`  ${i + 1}. ${status} ${s.content}`);
    });
    process.exit(1);
  }

  // Determine new completed state
  const newCompleted = completed ?? !step.completed;

  // Idempotent: if --on/--off was explicitly set and step is already in that state, skip
  if (completed !== undefined && step.completed === newCompleted) {
    const state = newCompleted ? 'completed' : 'uncompleted';
    console.log(`Step already ${state}.`);
    return;
  }

  const action = newCompleted ? 'Completing' : 'Uncompleting';

  console.log(`${action} step: ${step.content}`);

  await client.put(`/cards/${cardNumber}/steps/${step.id}.json`, {
    step: { completed: newCompleted },
  });

  console.log(`Step ${newCompleted ? 'completed' : 'uncompleted'}.`);
}
