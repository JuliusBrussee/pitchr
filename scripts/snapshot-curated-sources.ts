import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface SnapshotRecord {
  source_id: string;
  source_url: string;
  source_title: string;
  snapshot_date: string;
  access_status: 'full' | 'partial' | 'gated';
  key_rules_do: string[];
  key_rules_dont: string[];
  confidence_score: number;
  content_hash_sha256: string;
  screenshot_path: string;
}

const SOURCES = [
  {
    id: 'openvc-opendeck',
    url: 'https://www.openvc.app/opendeck',
    title: 'OpenVC OpenDeck',
  },
  {
    id: 'slideshare-sequoia-template',
    url: 'https://www.slideshare.net/slideshow/sequoia-capital-pitchdecktemplate/46231251',
    title: 'Sequoia Pitch Deck Template (SlideShare)',
  },
  {
    id: 'slidebean-story-examples',
    url: 'https://slidebean.com/fr/blog/pitch-deck-story-examples',
    title: 'Slidebean Story Examples',
  },
  {
    id: 'slidebean-sequoia-template',
    url: 'https://slidebean.com/templates/sequoia-pitch-deck-template',
    title: 'Slidebean Sequoia Template',
  },
  {
    id: 'yc-how-to-pitch',
    url: 'https://www.ycombinator.com/library/4b-how-to-pitch-your-company',
    title: 'YC: How to Pitch Your Company',
  },
  {
    id: 'yc-demo-day-guide',
    url: 'https://www.ycombinator.com/blog/guide-to-demo-day-pitches/',
    title: 'YC: Guide to Demo Day Pitches',
  },
  {
    id: 'yc-seed-deck',
    url: 'https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck',
    title: 'YC: Seed Round Pitch Deck',
  },
  {
    id: 'yc-first-time-mistakes',
    url: 'https://www.ycombinator.com/library/66-biggest-mistakes-first-time-founders-make',
    title: 'YC: Biggest First-Time Founder Mistakes',
  },
  {
    id: 'yc-investor-vs-customer-pitch',
    url: 'https://www.ycombinator.com/library/7u-how-pitching-investors-is-different-than-pitching-customers',
    title: 'YC: Investors vs Customers Pitching',
  },
];

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function extractRules(rawText: string): {
  doRules: string[];
  dontRules: string[];
  confidence: number;
} {
  const lines = rawText
    .split(/\r?\n/u)
    .map((line) => line.replace(/\s+/gu, ' ').trim())
    .filter((line) => line.length >= 24)
    .slice(0, 400);

  const doRules: string[] = [];
  const dontRules: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isDont =
      lower.includes("don't") ||
      lower.includes('do not') ||
      lower.includes('avoid') ||
      lower.includes('mistake') ||
      lower.includes('never');
    const isDo =
      lower.includes('should') ||
      lower.includes('focus on') ||
      lower.includes('include') ||
      lower.includes('must') ||
      lower.includes('keep');

    if (isDont && dontRules.length < 8) dontRules.push(line);
    if (isDo && doRules.length < 8) doRules.push(line);
    if (doRules.length >= 6 && dontRules.length >= 6) break;
  }

  const evidenceCount = doRules.length + dontRules.length;
  const confidence = Math.max(0.2, Math.min(0.95, evidenceCount / 12));
  return { doRules, dontRules, confidence };
}

async function main(): Promise<void> {
  let playwright: any;
  try {
    const moduleName = 'playwright';
    playwright = await import(moduleName);
  } catch {
    throw new Error(
      'Missing playwright dependency. Install with: yarn add -D playwright',
    );
  }

  const date = todayStamp();
  const outputDir = path.join(process.cwd(), 'knowledge', 'snapshots', date);
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });

  try {
    for (const source of SOURCES) {
      let accessStatus: SnapshotRecord['access_status'] = 'partial';
      let text = '';
      const screenshotPath = path.join(outputDir, `${source.id}.png`);

      try {
        const response = await page.goto(source.url, {
          waitUntil: 'domcontentloaded',
          timeout: 35_000,
        });
        await page.waitForTimeout(1_200);
        text = await page.evaluate(() => document.body?.innerText ?? '');

        if (response?.ok()) {
          accessStatus = text.length > 1500 ? 'full' : 'partial';
        } else if ((response?.status() ?? 0) >= 400) {
          accessStatus = 'gated';
        }
      } catch {
        accessStatus = 'gated';
      }

      await page.screenshot({ path: screenshotPath, fullPage: true });

      const { doRules, dontRules, confidence } = extractRules(text);
      const snapshot: SnapshotRecord = {
        source_id: source.id,
        source_url: source.url,
        source_title: source.title,
        snapshot_date: date,
        access_status: accessStatus,
        key_rules_do: doRules,
        key_rules_dont: dontRules,
        confidence_score: confidence,
        content_hash_sha256: hashText(text),
        screenshot_path: `knowledge/snapshots/${date}/${source.id}.png`,
      };

      await fs.writeFile(
        path.join(outputDir, `${source.id}.json`),
        JSON.stringify(snapshot, null, 2),
        'utf8',
      );
    }
  } finally {
    await page.close();
    await browser.close();
  }

  // eslint-disable-next-line no-console
  console.log(`Curated snapshots written to knowledge/snapshots/${date}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Snapshot collection failed:', error);
  process.exitCode = 1;
});
