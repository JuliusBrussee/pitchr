import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { chromium } from 'playwright';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BASE_URL = process.env.THEME_AUDIT_BASE_URL ?? 'http://127.0.0.1:3000';
const OUTPUT_ROOT = path.resolve('.playwright-theme-scan-auth');
const SHOTS_DIR = path.join(OUTPUT_ROOT, 'protected-shots');
const OUTPUT_FILE = path.join(OUTPUT_ROOT, 'protected-theme-metrics.json');
const AUDIT_PASSWORD = process.env.THEME_AUDIT_PASSWORD ?? 'PitchrThemeAudit!123';

const DUMMY_ID = '00000000-0000-0000-0000-000000000000';
const ROUTES = [
  '/dashboard',
  '/demo',
  '/setup',
  '/upload',
  '/session',
  '/session/select-project',
  '/arena',
  '/arena/challenge/1',
  '/arena/game-mode',
  '/arena/leaderboard',
  '/compliance/check',
  '/analytics',
  '/history',
  '/projects',
  '/projects/1',
  `/qa/${DUMMY_ID}`,
  `/results/${DUMMY_ID}`,
  `/review/${DUMMY_ID}`,
  '/orb-preview',
  '/progress',
  '/settings',
];

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function safeRoute(route) {
  return route.replace(/^\//, '').replace(/[/?#=&:]+/g, '_');
}

async function createAuditUser(email, password) {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'protected-theme-audit' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create audit user (${response.status}): ${await response.text()}`);
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45_000 }),
    page.getByRole('button', { name: /^Sign in$/i }).click(),
  ]);
}

async function setTheme(page, theme) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.evaluate((value) => {
    localStorage.setItem('pitchr-theme', value);
    document.documentElement.classList.toggle('dark', value === 'dark');
  }, theme);
}

async function pageSample(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return {
      h1Text: h1?.textContent?.trim() ?? '',
      h1Color: h1 ? getComputedStyle(h1).color : '',
      rootClassList: document.documentElement.className,
      localStorageTheme: localStorage.getItem('pitchr-theme'),
      bodyClass: document.body.className,
    };
  });
}

async function run() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });

  const auditEmail = `protected-theme-audit+${Date.now()}@pitchr.dev`;
  await createAuditUser(auditEmail, AUDIT_PASSWORD);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  const page = await context.newPage();

  await login(page, auditEmail, AUDIT_PASSWORD);

  const rows = [];

  for (const theme of ['light', 'dark']) {
    console.log(`[protected-audit] theme=${theme}`);
    await setTheme(page, theme);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });

    for (const route of ROUTES) {
      const row = {
        route,
        theme,
        targetUrl: new URL(route, BASE_URL).toString(),
        finalUrl: '',
        screenshot: '',
        sample: null,
        error: null,
      };

      console.log(`[protected-audit] ${theme} ${route}`);
      try {
        await page.goto(row.targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {});
        await page.waitForTimeout(250);
        row.finalUrl = page.url();
        row.sample = await pageSample(page);
      } catch (error) {
        row.finalUrl = page.url();
        row.error = error instanceof Error ? error.message : String(error);
      }

      const fileName = `${safeRoute(route)}__${theme}.png`;
      const screenshotPath = path.join(SHOTS_DIR, fileName);
      row.screenshot = screenshotPath;
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      rows.push(row);
    }
  }

  await browser.close();
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        routeCount: ROUTES.length,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`protected_metrics=${OUTPUT_FILE}`);
}

run().catch((error) => {
  console.error('[protected-audit] fatal', error);
  process.exitCode = 1;
});
