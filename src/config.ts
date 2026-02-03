// Config management - loads from .env file

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  apiToken: string;
  accountId: string;
  baseUrl: string;
}

function findEnvFile(): string | null {
  // Check paths in order of priority
  const paths = [
    join(process.cwd(), '.env'),
    join(homedir(), '.config', 'fizzy', '.env'),
    join(homedir(), '.fizzy', '.env'),
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }
  return env;
}

export function loadConfig(): Config {
  const envFile = findEnvFile();

  let fileEnv: Record<string, string> = {};
  if (envFile) {
    const content = readFileSync(envFile, 'utf-8');
    fileEnv = parseEnvFile(content);
  }

  // Environment variables override file values
  const apiToken = process.env.FIZZY_API_TOKEN || fileEnv.FIZZY_API_TOKEN || '';
  const accountId = process.env.FIZZY_ACCOUNT_ID || fileEnv.FIZZY_ACCOUNT_ID || '';

  if (!apiToken || apiToken === 'your_api_token_here') {
    console.error('Error: FIZZY_API_TOKEN not set');
    console.error('Set it via environment variable or in a .env file');
    console.error('');
    console.error('Searched locations:');
    console.error('  - ./.env');
    console.error('  - ~/.config/fizzy/.env');
    console.error('  - ~/.fizzy/.env');
    process.exit(1);
  }

  if (!accountId) {
    console.error('Error: FIZZY_ACCOUNT_ID not set');
    console.error('Set it via environment variable or in a .env file');
    process.exit(1);
  }

  return {
    apiToken,
    accountId,
    baseUrl: `https://app.fizzy.do/${accountId}`,
  };
}
