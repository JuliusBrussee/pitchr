import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_FILES_TO_SCAN = ['.env', '.env.local', 'supabase/functions/.env'];
const ENV_EXAMPLE_FILES = ['.env.example', 'supabase/functions/.env.example'];
const ALWAYS_ALLOWED_KEYS = new Set([
  'NODE_ENV',
  'PORT',
  'DOTENV_CONFIG_PATH',
  'ALLOWED_ORIGINS',
]);
const DEPRECATED_KEYS = [
  { key: 'PAIDAI_API_KEY', replacement: 'PAID_API_KEY' },
];

function absolute(relPath) {
  return path.join(ROOT, relPath);
}

function parseEnvFile(relPath) {
  const filePath = absolute(relPath);
  if (!fs.existsSync(filePath)) {
    return { exists: false, entries: new Map(), duplicates: new Map(), warnings: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/u);
  const entries = new Map();
  const duplicates = new Map();
  const warnings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
    if (!match) {
      warnings.push(
        `${relPath}:${index + 1} ignored because it is not a valid KEY=VALUE entry.`,
      );
      continue;
    }

    const [, key, value] = match;
    if (entries.has(key)) {
      const existingLines = duplicates.get(key) ?? [entries.get(key).line];
      existingLines.push(index + 1);
      duplicates.set(key, existingLines);
    }

    entries.set(key, { value, line: index + 1 });
  }

  return { exists: true, entries, duplicates, warnings };
}

function main() {
  const strict = process.env.VALIDATE_ENV_STRICT === 'true';
  const warnings = [];

  const parsedExamples = ENV_EXAMPLE_FILES.map((file) => ({
    file,
    ...parseEnvFile(file),
  }));
  const allowedKeys = new Set(ALWAYS_ALLOWED_KEYS);
  for (const parsed of parsedExamples) {
    if (!parsed.exists) continue;
    for (const key of parsed.entries.keys()) {
      allowedKeys.add(key);
    }
  }

  const parsedEnvFiles = ENV_FILES_TO_SCAN.map((file) => ({
    file,
    ...parseEnvFile(file),
  }));

  const mergedKeys = new Set();
  for (const parsed of parsedEnvFiles) {
    for (const warning of parsed.warnings) {
      warnings.push(`[validate-env] ${warning}`);
    }
    for (const [key, lineNumbers] of parsed.duplicates.entries()) {
      warnings.push(
        `[validate-env] ${parsed.file}: duplicate key ${key} defined on lines ${lineNumbers.join(', ')}.`,
      );
    }
    for (const key of parsed.entries.keys()) {
      mergedKeys.add(key);
      if (!allowedKeys.has(key)) {
        warnings.push(
          `[validate-env] ${parsed.file}:${parsed.entries.get(key).line} unexpected key ${key}.`,
        );
      }
    }
  }

  for (const { key, replacement } of DEPRECATED_KEYS) {
    if (mergedKeys.has(key)) {
      if (!mergedKeys.has(replacement)) {
        warnings.push(
          `[validate-env] Found deprecated ${key} without ${replacement}. Rename it to ${replacement}.`,
        );
      } else {
        warnings.push(
          `[validate-env] Found deprecated ${key}. Remove it and keep ${replacement}.`,
        );
      }
    }
  }

  if (warnings.length === 0) {
    console.log('[validate-env] No environment warnings found.');
    return;
  }

  console.warn(`[validate-env] Found ${warnings.length} warning(s):`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }

  if (strict) {
    process.exitCode = 1;
  }
}

main();
