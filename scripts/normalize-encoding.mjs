import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.yarn',
]);

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

function decodeUtf16Be(bufferWithoutBom) {
  const swapped = Buffer.allocUnsafe(bufferWithoutBom.length);
  for (let i = 0; i < bufferWithoutBom.length; i += 2) {
    swapped[i] = bufferWithoutBom[i + 1] ?? 0x00;
    swapped[i + 1] = bufferWithoutBom[i] ?? 0x00;
  }
  return swapped.toString('utf16le');
}

function normalizeFile(filePath) {
  const absolutePath = path.join(ROOT, filePath);
  const buffer = fs.readFileSync(absolutePath);

  if (hasUtf16LeBom(buffer)) {
    let text = buffer.slice(2).toString('utf16le');
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    fs.writeFileSync(absolutePath, Buffer.from(text, 'utf8'));
    return 'utf16le->utf8';
  }

  if (hasUtf16BeBom(buffer)) {
    let text = decodeUtf16Be(buffer.slice(2));
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    fs.writeFileSync(absolutePath, Buffer.from(text, 'utf8'));
    return 'utf16be->utf8';
  }

  if (hasUtf8Bom(buffer)) {
    fs.writeFileSync(absolutePath, buffer.slice(3));
    return 'utf8-bom->utf8';
  }

  return null;
}

function walkDirectory(relativeDir, outputFiles) {
  const absoluteDir = path.join(ROOT, relativeDir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const normalized = relativePath.replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      walkDirectory(relativePath, outputFiles);
      continue;
    }

    if (!isTargetTextFile(normalized)) {
      continue;
    }
    outputFiles.push(normalized);
  }
}

function main() {
  const candidates = [];
  walkDirectory('.', candidates);

  const converted = [];
  for (const relativePath of candidates.sort()) {
    const result = normalizeFile(relativePath);
    if (result) {
      converted.push({ file: relativePath, action: result });
    }
  }

  if (converted.length === 0) {
    console.log('No encoding changes required.');
    return;
  }

  console.log('Normalized file encodings:');
  for (const item of converted) {
    console.log(`- ${item.file} (${item.action})`);
  }
  console.log(`Total converted: ${converted.length}`);
}

main();
