import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const REQUIRED_MODULES = [
  '@vercel/analytics/next',
  '@vercel/speed-insights/next',
];

const missingModules = [];

for (const moduleName of REQUIRED_MODULES) {
  try {
    require.resolve(moduleName);
  } catch {
    missingModules.push(moduleName);
  }
}

if (missingModules.length > 0) {
  console.error('[check:vercel-integrations] Missing required modules:');
  for (const moduleName of missingModules) {
    console.error(`- ${moduleName}`);
  }
  console.error(
    '[check:vercel-integrations] Run `yarn install` to restore dependencies before typecheck/build.',
  );
  process.exit(1);
}

console.log('[check:vercel-integrations] Vercel analytics integrations resolved.');
