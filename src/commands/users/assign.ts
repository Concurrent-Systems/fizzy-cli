// fizzy assign - Assign/unassign a user to/from a card

import type { FizzyClient } from '../../client';
import type { User } from '../../types/api';

export async function assignUser(
  client: FizzyClient,
  cardNumber: string,
  userIdentifier: string
): Promise<void> {
  // Find user by ID, name, or email
  const users = await client.getAll<User>('/users.json');
  const user = users.find(
    u => u.id === userIdentifier ||
         u.name.toLowerCase().includes(userIdentifier.toLowerCase()) ||
         u.email_address.toLowerCase().includes(userIdentifier.toLowerCase())
  );

  if (!user) {
    console.error(`User not found: ${userIdentifier}`);
    console.error('');
    console.error('Available users:');
    for (const u of users) {
      console.error(`  - ${u.name} (${u.email_address})`);
    }
    process.exit(1);
  }

  console.log(`Toggling assignment of ${user.name} on card #${cardNumber}...`);

  // The assignments endpoint toggles assignment
  await client.post(`/cards/${cardNumber}/assignments.json`, {
    assignee_id: user.id,
  });

  console.log('Assignment toggled.');
}
