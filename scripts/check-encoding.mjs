import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.md',
  '.yml',
  '.yaml',
]);

const SPECIAL_FILENAMES = new Set([
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
]);

const BOM_ENFORCED_PREFIXES = [
  'app/',
  'views/',
  'hooks/',
  'lib/',
  'services/',
  'models/',
  'controllers/',
  'config/',
  'types/',
  'scripts/',
  'docs/',
];

function isTargetTextFile(filePath) {
  const basename = path.basename(filePath);
  if (SPECIAL_FILENAMES.has(basename)) return true;
  if (basename.startsWith('.env')) return true;
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function hasUtf16LeBom(buffer) {
  return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
}

function hasUtf16BeBom(buffer) {
  return buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff;
}

function hasUtf8Bom(buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  );
}

function shouldDisallowUtf8Bom(filePath) {
  if (
    filePath === 'package.json' ||
    filePath === 'README.md' ||
    filePath === '.env.example'
  ) {
    return true;
  }
  return BOM_ENFORCED_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function getTrackedFiles() {
  const raw = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return raw
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean);
}

function main() {
  const trackedFiles = getTrackedFiles();
  const issues = [];

  for (const filePath of trackedFiles) {
    if (!isTargetTextFile(filePath)) continue;
    const absolutePath = path.join(ROOT, filePath);
    if (!fs.existsSync(absolutePath)) continue;
    const buffer = fs.readFileSync(absolutePath);

    if (hasUtf16LeBom(buffer)) {
      issues.push(`${filePath}: UTF-16 LE BOM detected`);
      continue;
    }
    if (hasUtf16BeBom(buffer)) {
      issues.push(`${filePath}: UTF-16 BE BOM detected`);
      continue;
    }
    if (hasUtf8Bom(buffer) && shouldDisallowUtf8Bom(filePath)) {
      issues.push(`${filePath}: UTF-8 BOM detected`);
      continue;
    }
  }

  if (issues.length > 0) {
    console.error('Encoding check failed:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    console.error('Run: yarn fix:encoding');
    process.exit(1);
  }

  console.log('Encoding check passed (UTF-8 text files, no disallowed BOMs).');
}

main();
