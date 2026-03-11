#!/usr/bin/env bun

// Fizzy CLI - Command-line interface for Fizzy kanban boards

import { Command } from 'commander';
import { loadConfig } from './config';
import { FizzyClient } from './client';

// Commands
import { listBoards } from './commands/boards/list';
import { createBoard } from './commands/boards/create';
import { listColumns, addColumn, renameColumn, deleteColumn } from './commands/boards/columns';
import { showCard } from './commands/cards/show';
import { listCards, searchCards, myCards } from './commands/cards/list';
import { createCard } from './commands/cards/create';
import { updateCard } from './commands/cards/update';
import { deleteCard } from './commands/cards/delete';
import { moveCard } from './commands/cards/move';
import { triageCard } from './commands/cards/triage';
import { closeCard, reopenCard } from './commands/cards/close';
import { addComment } from './commands/comments/add';
import { editComment } from './commands/comments/edit';
import { deleteComment } from './commands/comments/delete';
import { addStep } from './commands/steps/add';
import { checkStep } from './commands/steps/check';
import { deleteStep } from './commands/steps/delete';
import { tagCard, untagCard } from './commands/tags/tag';
import { listUsers } from './commands/users/list';
import { assignUser } from './commands/users/assign';
import { attachFile } from './commands/attachments/attach';
import { downloadAttachments } from './commands/attachments/download';

const program = new Command();

program
  .name('fizzy')
  .description('CLI for Fizzy kanban board management')
  .version('1.0.0')
  .addHelpText('after', `
Tips:
  Use @Name in comments/descriptions for mentions (triggers notifications)
  Use card -v to see comment and step IDs for editing/targeting
  Use --on/--off with steps-check for safe, idempotent check/uncheck
  Board, user, tag, and column names resolve case-insensitively
  Run "fizzy help <command>" for detailed usage of any command`);

// Create client lazily to allow --help without config
let client: FizzyClient | null = null;
function getClient(): FizzyClient {
  if (!client) {
    const config = loadConfig();
    client = new FizzyClient(config);
  }
  return client;
}

// ============================================================================
// BOARDS
// ============================================================================

program
  .command('boards')
  .description('List all boards')
  .action(async () => {
    await listBoards(getClient());
  });

program
  .command('boards-create')
  .description('Create a new board')
  .argument('<name>', 'Board name')
  .option('--private', 'Make board private (not all-access)')
  .action(async (name: string, options: { private?: boolean }) => {
    await createBoard(getClient(), name, { allAccess: !options.private });
  });

// ============================================================================
// COLUMNS
// ============================================================================

program
  .command('columns')
  .description('List columns on a board')
  .argument('<board>', 'Board ID or name')
  .action(async (board: string) => {
    await listColumns(getClient(), board);
  });

program
  .command('columns-add')
  .description('Add a column to a board')
  .argument('<board>', 'Board ID or name')
  .argument('<name>', 'Column name')
  .option('-c, --color <color>', 'Column color (blue, gray, tan, yellow, lime, aqua, violet, purple, pink)')
  .action(async (board: string, name: string, options: { color?: string }) => {
    await addColumn(getClient(), board, name, options);
  });

program
  .command('columns-rename')
  .description('Rename a column on a board')
  .argument('<board>', 'Board ID or name')
  .argument('<column>', 'Column ID or name')
  .argument('<name>', 'New column name')
  .action(async (board: string, column: string, name: string) => {
    await renameColumn(getClient(), board, column, name);
  });

program
  .command('columns-delete')
  .description('Delete a column from a board')
  .argument('<board>', 'Board ID or name')
  .argument('<column>', 'Column ID or name')
  .action(async (board: string, column: string) => {
    await deleteColumn(getClient(), board, column);
  });

// ============================================================================
// CARDS
// ============================================================================

program
  .command('card')
  .description('View a card with description, steps, and comments')
  .argument('<number>', 'Card number')
  .option('-v, --verbose', 'Show comment and step IDs for targeting')
  .action(async (number: string, options: { verbose?: boolean }) => {
    await showCard(getClient(), number, options);
  });

program
  .command('cards')
  .description('List cards')
  .option('-b, --board <board>', 'Filter by board')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-a, --assignee <user>', 'Filter by assignee')
  .option('-s, --status <status>', 'Filter by status (all, closed, not_now, stalled)')
  .option('--sorted <order>', 'Sort order (latest, newest, oldest)')
  .action(async (options: { board?: string; tag?: string; assignee?: string; status?: string; sorted?: string }) => {
    await listCards(getClient(), options);
  });

program
  .command('cards-mine')
  .description('List my assigned cards')
  .action(async () => {
    await myCards(getClient());
  });

program
  .command('search')
  .description('Search cards by keyword')
  .argument('<term>', 'Search term')
  .action(async (term: string) => {
    await searchCards(getClient(), term);
  });

program
  .command('cards-create')
  .description('Create a new card')
  .argument('<title>', 'Card title')
  .requiredOption('-b, --board <board>', 'Board ID or name')
  .option('-d, --description <text>', 'Card description (markdown, @mentions supported)')
  .option('-f, --file <path>', 'Read description from file')
  .option('-t, --tags <tags...>', 'Tags to apply')
  .option('--draft', 'Create as draft (not visible to team until published)')
  .action(async (title: string, options: { board: string; description?: string; file?: string; tags?: string[]; draft?: boolean }) => {
    await createCard(getClient(), title, options);
  });

program
  .command('cards-update')
  .description('Update a card title or description')
  .argument('<number>', 'Card number')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <text>', 'New description (markdown, @mentions supported)')
  .option('-f, --file <path>', 'Read description from file')
  .action(async (number: string, options: { title?: string; description?: string; file?: string }) => {
    await updateCard(getClient(), number, options);
  });

program
  .command('cards-delete')
  .description('Delete a card')
  .argument('<number>', 'Card number')
  .action(async (number: string) => {
    await deleteCard(getClient(), number);
  });

program
  .command('cards-move')
  .description('Move a card to another board')
  .argument('<number>', 'Card number')
  .argument('<board>', 'Target board')
  .action(async (number: string, board: string) => {
    await moveCard(getClient(), number, board);
  });

program
  .command('cards-triage')
  .description('Move a card to/from triage or to a column')
  .argument('<number>', 'Card number')
  .argument('[column]', 'Column name (omit to send back to triage)')
  .action(async (number: string, column?: string) => {
    await triageCard(getClient(), number, column);
  });

program
  .command('done')
  .description('Close a card')
  .argument('<number>', 'Card number')
  .action(async (number: string) => {
    await closeCard(getClient(), number);
  });

program
  .command('reopen')
  .description('Reopen a closed card')
  .argument('<number>', 'Card number')
  .action(async (number: string) => {
    await reopenCard(getClient(), number);
  });

// ============================================================================
// COMMENTS
// ============================================================================

program
  .command('comment')
  .description('Add a comment to a card (supports markdown and @mentions)')
  .argument('<number>', 'Card number')
  .argument('<text>', 'Comment text (markdown, use @Name for mentions)')
  .action(async (number: string, text: string) => {
    await addComment(getClient(), number, text);
  });

program
  .command('comments-edit')
  .description('Edit a comment (use card -v to find comment IDs)')
  .argument('<number>', 'Card number')
  .argument('<commentId>', 'Comment ID (from card -v)')
  .argument('<text>', 'New comment text (markdown, use @Name for mentions)')
  .action(async (number: string, commentId: string, text: string) => {
    await editComment(getClient(), number, commentId, text);
  });

program
  .command('comments-delete')
  .description('Delete a comment (use card -v to find comment IDs)')
  .argument('<number>', 'Card number')
  .argument('<commentId>', 'Comment ID (from card -v)')
  .action(async (number: string, commentId: string) => {
    await deleteComment(getClient(), number, commentId);
  });

// ============================================================================
// STEPS
// ============================================================================

program
  .command('steps-add')
  .description('Add a step to a card')
  .argument('<number>', 'Card number')
  .argument('<content>', 'Step content')
  .action(async (number: string, content: string) => {
    await addStep(getClient(), number, content);
  });

program
  .command('steps-check')
  .description('Check/uncheck a step (toggles by default, use --on/--off for idempotent)')
  .argument('<number>', 'Card number')
  .argument('<step>', 'Step index (1-based), ID, or content substring')
  .option('--on', 'Mark as completed (no-op if already done)')
  .option('--off', 'Mark as not completed (no-op if already unchecked)')
  .action(async (number: string, step: string, options: { on?: boolean; off?: boolean }) => {
    const completed = options.on ? true : options.off ? false : undefined;
    await checkStep(getClient(), number, step, completed);
  });

program
  .command('steps-delete')
  .description('Delete a step')
  .argument('<number>', 'Card number')
  .argument('[step]', 'Step index (1-based), ID, or content substring')
  .option('--all', 'Delete all steps')
  .option('--completed', 'Delete only completed steps')
  .action(async (number: string, step: string | undefined, options: { all?: boolean; completed?: boolean }) => {
    await deleteStep(getClient(), number, step, options);
  });

// ============================================================================
// TAGS
// ============================================================================

program
  .command('tag')
  .description('Add a tag to a card')
  .argument('<number>', 'Card number')
  .argument('<tag>', 'Tag name')
  .action(async (number: string, tag: string) => {
    await tagCard(getClient(), number, tag);
  });

program
  .command('untag')
  .description('Remove a tag from a card')
  .argument('<number>', 'Card number')
  .argument('<tag>', 'Tag name')
  .action(async (number: string, tag: string) => {
    await untagCard(getClient(), number, tag);
  });

// ============================================================================
// USERS
// ============================================================================

program
  .command('users')
  .description('List users in the account')
  .action(async () => {
    await listUsers(getClient());
  });

program
  .command('assign')
  .description('Toggle assignment of a user to a card')
  .argument('<number>', 'Card number')
  .argument('<user>', 'User name, email, or ID (case-insensitive)')
  .action(async (number: string, user: string) => {
    await assignUser(getClient(), number, user);
  });

// ============================================================================
// ATTACHMENTS
// ============================================================================

program
  .command('attach')
  .description('Upload and attach a file to a card')
  .argument('<number>', 'Card number')
  .argument('<file>', 'File path')
  .argument('[comment]', 'Comment text')
  .action(async (number: string, file: string, comment?: string) => {
    await attachFile(getClient(), number, file, comment);
  });

program
  .command('download')
  .description('Download attachments from a card')
  .argument('<number>', 'Card number')
  .argument('[filename]', 'Specific file to download (optional, partial match)')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('-l, --list', 'List attachments without downloading')
  .action(async (number: string, filename: string | undefined, options: { output?: string; list?: boolean }) => {
    await downloadAttachments(getClient(), number, filename, options);
  });

// Parse and run
program.parse();
