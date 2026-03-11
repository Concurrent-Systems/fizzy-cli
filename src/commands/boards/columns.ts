// fizzy columns - List columns on a board

import type { FizzyClient } from '../../client';
import type { Board, Column } from '../../types/api';

export async function listColumns(
  client: FizzyClient,
  boardIdOrName: string
): Promise<void> {
  // Try to find board by ID or name
  const boards = await client.getAll<Board>('/boards.json');
  const board = boards.find(
    b => b.id === boardIdOrName || b.name.toLowerCase() === boardIdOrName.toLowerCase()
  );

  if (!board) {
    console.error(`Board not found: ${boardIdOrName}`);
    process.exit(1);
  }

  console.log(`Columns on "${board.name}":`);
  console.log('======================================');
  console.log('');

  const columns = await client.getAll<Column>(`/boards/${board.id}/columns.json`);

  if (columns.length === 0) {
    console.log('No columns defined (using triage only).');
    return;
  }

  for (const column of columns) {
    const colorName = parseColorName(column.color);
    console.log(`${column.name}`);
    console.log(`  ID:    ${column.id}`);
    console.log(`  Color: ${colorName}`);
    console.log('');
  }

  console.log(`Total: ${columns.length} columns`);
}

export async function addColumn(
  client: FizzyClient,
  boardIdOrName: string,
  name: string,
  options: { color?: string }
): Promise<void> {
  // Find board
  const boards = await client.getAll<Board>('/boards.json');
  const board = boards.find(
    b => b.id === boardIdOrName || b.name.toLowerCase() === boardIdOrName.toLowerCase()
  );

  if (!board) {
    console.error(`Board not found: ${boardIdOrName}`);
    process.exit(1);
  }

  const color = options.color ? parseColorValue(options.color) : undefined;

  await client.post(`/boards/${board.id}/columns.json`, {
    column: {
      name,
      ...(color && { color }),
    },
  });

  console.log(`Column created: ${name}`);
  console.log(`Board: ${board.name}`);
}

export async function renameColumn(
  client: FizzyClient,
  boardIdOrName: string,
  columnIdOrName: string,
  newName: string
): Promise<void> {
  const { board, column } = await resolveColumn(client, boardIdOrName, columnIdOrName);

  console.log(`Renaming column "${column.name}" to "${newName}" on "${board.name}"...`);

  await client.put(`/boards/${board.id}/columns/${column.id}.json`, {
    column: { name: newName },
  });

  console.log('Column renamed.');
}

export async function deleteColumn(
  client: FizzyClient,
  boardIdOrName: string,
  columnIdOrName: string
): Promise<void> {
  const { board, column } = await resolveColumn(client, boardIdOrName, columnIdOrName);

  console.log(`Deleting column "${column.name}" from "${board.name}"...`);

  await client.delete(`/boards/${board.id}/columns/${column.id}.json`);

  console.log('Column deleted.');
}

async function resolveColumn(
  client: FizzyClient,
  boardIdOrName: string,
  columnIdOrName: string
): Promise<{ board: Board; column: Column }> {
  const boards = await client.getAll<Board>('/boards.json');
  const board = boards.find(
    b => b.id === boardIdOrName || b.name.toLowerCase() === boardIdOrName.toLowerCase()
  );

  if (!board) {
    console.error(`Board not found: ${boardIdOrName}`);
    process.exit(1);
  }

  const columns = await client.getAll<Column>(`/boards/${board.id}/columns.json`);
  const column = columns.find(
    c => c.id === columnIdOrName || c.name.toLowerCase() === columnIdOrName.toLowerCase()
  );

  if (!column) {
    console.error(`Column not found: ${columnIdOrName}`);
    console.error('');
    console.error('Available columns:');
    for (const c of columns) {
      console.error(`  - ${c.name} (${c.id})`);
    }
    process.exit(1);
  }

  return { board, column };
}

// Color mapping
const colorMap: Record<string, string> = {
  'blue': 'var(--color-card-default)',
  'gray': 'var(--color-card-1)',
  'grey': 'var(--color-card-1)',
  'tan': 'var(--color-card-2)',
  'yellow': 'var(--color-card-3)',
  'lime': 'var(--color-card-4)',
  'green': 'var(--color-card-4)',
  'aqua': 'var(--color-card-5)',
  'cyan': 'var(--color-card-5)',
  'violet': 'var(--color-card-6)',
  'purple': 'var(--color-card-7)',
  'pink': 'var(--color-card-8)',
};

function parseColorValue(color: string): string {
  const lower = color.toLowerCase();
  return colorMap[lower] || color;
}

function parseColorName(color: string): string {
  for (const [name, value] of Object.entries(colorMap)) {
    if (value === color) return name;
  }
  return color;
}
