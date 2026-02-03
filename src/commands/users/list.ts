// fizzy users - List users in the account

import type { FizzyClient } from '../../client';
import type { User } from '../../types/api';

export async function listUsers(client: FizzyClient): Promise<void> {
  console.log(`Users in account ${client.accountId}:`);
  console.log('======================================');
  console.log('');

  const users = await client.getAll<User>('/users.json');

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  for (const user of users) {
    const status = user.active ? '' : ' (inactive)';
    console.log(`${user.name}${status}`);
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email_address}`);
    console.log(`  Role:  ${user.role}`);
    console.log('');
  }

  console.log(`Total: ${users.length} users`);
}
