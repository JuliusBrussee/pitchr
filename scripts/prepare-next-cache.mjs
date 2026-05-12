import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const NEXT_LINK_PATH = path.join(PROJECT_ROOT, '.next');

function normalizeForCompare(value) {
  return value.replace(/[\\/]+/g, '\\').replace(/^\\\\\?\\/, '').toLowerCase();
}

function resolveFromLink(linkPath, targetPath) {
  if (path.isAbsolute(targetPath)) return path.resolve(targetPath);
  return path.resolve(path.dirname(linkPath), targetPath);
}

async function pathExists(targetPath) {
  try {
    await fs.promises.lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureJunction(linkPath, targetPath) {
  const exists = await pathExists(linkPath);
  if (exists) {
    const stat = await fs.promises.lstat(linkPath);
    if (stat.isSymbolicLink()) {
      const currentTargetRaw = await fs.promises.readlink(linkPath);
      const currentTargetResolved = resolveFromLink(linkPath, currentTargetRaw);
      if (
        normalizeForCompare(currentTargetResolved) === normalizeForCompare(targetPath)
      ) {
        return;
      }
    }
    await fs.promises.rm(linkPath, { recursive: true, force: true });
  }

  await fs.promises.symlink(targetPath, linkPath, 'junction');
}

async function resetDirectoryContents(targetPath) {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
  await fs.promises.mkdir(targetPath, { recursive: true });
}

async function main() {
  if (process.platform !== 'win32') {
    return;
  }

  const localBase = process.env.LOCALAPPDATA || path.join(os.tmpdir(), 'pitchr-cache');
  const repoHash = crypto
    .createHash('sha1')
    .update(PROJECT_ROOT)
    .digest('hex')
    .slice(0, 12);
  const cacheRoot = path.join(localBase, 'pitchr-next-cache');
  const targetPath = path.join(cacheRoot, repoHash);
  const projectNodeModules = path.join(PROJECT_ROOT, 'node_modules');
  const sharedNodeModulesLink = path.join(cacheRoot, 'node_modules');

  await fs.promises.mkdir(targetPath, { recursive: true });
  if (process.env.NEXT_CACHE_RESET === 'true') {
    await resetDirectoryContents(targetPath);
  }
  if (await pathExists(projectNodeModules)) {
    await ensureJunction(sharedNodeModulesLink, projectNodeModules);
  }
  await ensureJunction(NEXT_LINK_PATH, targetPath);

  if (await pathExists(projectNodeModules)) {
    console.log(
      `Prepared local Next cache junctions: ${NEXT_LINK_PATH} -> ${targetPath}, ${sharedNodeModulesLink} -> ${projectNodeModules}`,
    );
    return;
  }

  console.log(`Prepared local Next cache junction: ${NEXT_LINK_PATH} -> ${targetPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to prepare local Next cache: ${message}`);
  process.exit(1);
});
