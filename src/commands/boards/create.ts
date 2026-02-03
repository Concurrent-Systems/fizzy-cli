// fizzy boards create - Create a new board

import type { FizzyClient } from '../../client';

export async function createBoard(
  client: FizzyClient,
  name: string,
  options: { allAccess?: boolean }
): Promise<void> {
  console.log(`Creating board: ${name}`);

  await client.post('/boards.json', {
    board: {
      name,
      all_access: options.allAccess ?? true,
    },
  });

  console.log(`Board created: ${name}`);
  console.log(`URL: ${client.baseUrl}/boards`);
}
