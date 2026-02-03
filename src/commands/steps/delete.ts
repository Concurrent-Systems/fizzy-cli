// fizzy steps delete - Delete a step

import type { FizzyClient } from '../../client';
import type { Card, Step } from '../../types/api';

interface DeleteOptions {
  all?: boolean;
  completed?: boolean;
}

export async function deleteStep(
  client: FizzyClient,
  cardNumber: string,
  stepIdentifier?: string,
  options: DeleteOptions = {}
): Promise<void> {
  // Get the card to find steps
  const card = await client.get<Card>(`/cards/${cardNumber}.json`);

  if (!card.steps || card.steps.length === 0) {
    console.error(`Card #${cardNumber} has no steps.`);
    process.exit(1);
  }

  // Collect steps to delete
  let stepsToDelete: Step[] = [];

  if (options.all) {
    stepsToDelete = card.steps;
    console.log(`Deleting all ${stepsToDelete.length} steps from card #${cardNumber}...`);
  } else if (options.completed) {
    stepsToDelete = card.steps.filter(s => s.completed);
    if (stepsToDelete.length === 0) {
      console.log('No completed steps to delete.');
      return;
    }
    console.log(`Deleting ${stepsToDelete.length} completed steps from card #${cardNumber}...`);
  } else if (stepIdentifier) {
    // Find step by ID or index or content
    const index = parseInt(stepIdentifier, 10);
    let step: Step | undefined;

    if (!isNaN(index) && index > 0 && index <= card.steps.length) {
      step = card.steps[index - 1];
    } else {
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

    stepsToDelete = [step];
    console.log(`Deleting step: ${step.content}`);
  } else {
    console.error('Error: Specify a step identifier, --all, or --completed');
    process.exit(1);
  }

  // Delete steps
  for (const step of stepsToDelete) {
    await client.delete(`/cards/${cardNumber}/steps/${step.id}.json`);
  }

  console.log(`Deleted ${stepsToDelete.length} step(s).`);
}
