#!/usr/bin/env npx tsx
/**
 * Screenshot Capture for Executive Intent Proof System
 *
 * Captures vendor dashboard screenshots using Playwright headless browser.
 * Run locally (NOT in CI) since it requires authenticated sessions.
 *
 * Usage: pnpm proof:screenshots
 *
 * Note: For authenticated dashboards, you'll need to be logged in via browser.
 * The script uses a persistent browser context to leverage existing sessions.
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'demo-assets', 'screens');

interface ScreenshotConfig {
  name: string;
  filename: string;
  url: string;
  description: string;
  waitFor?: string; // CSS selector to wait for
  requiresAuth?: boolean;
}

// Screenshot configurations - Third-party vendor dashboards showing actual data
const SCREENSHOTS: ScreenshotConfig[] = [
  {
    name: 'Supabase - Documents Table',
    filename: 'step-1-supabase-documents.png',
    url: `https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF || 'vgjtvnmqtembvriscrzu'}/editor/29537`,
    description: 'Supabase table editor showing synced documents',
    requiresAuth: true,
  },
  {
    name: 'Supabase - Embeddings Table',
    filename: 'step-2-supabase-embeddings.png',
    url: `https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF || 'vgjtvnmqtembvriscrzu'}/editor/29539`,
    description: 'Supabase table editor showing vector embeddings',
    requiresAuth: true,
  },
  {
    name: 'Inngest - Workflow Runs',
    filename: 'step-3-inngest-runs.png',
    url: 'https://app.inngest.com/env/production/functions',
    description: 'Inngest dashboard showing workflow execution history',
    requiresAuth: true,
  },
  {
    name: 'Nightfall - DLP Dashboard',
    filename: 'step-4-nightfall-dlp.png',
    url: 'https://app.nightfall.ai/detection-rules',
    description: 'Nightfall DLP showing detection policy and scan results',
    requiresAuth: true,
  },
];

async function ensureOutputDir(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

async function captureScreenshot(
  page: Page,
  config: ScreenshotConfig
): Promise<boolean> {
  const outputPath = path.join(OUTPUT_DIR, config.filename);

  try {
    console.log(`\nCapturing: ${config.name}`);
    console.log(`  URL: ${config.url}`);

    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for specific element if configured
    if (config.waitFor) {
      try {
        await page.waitForSelector(config.waitFor, { timeout: 10000 });
      } catch {
        console.log(`  Warning: Could not find ${config.waitFor}, proceeding anyway`);
      }
    }

    // Small delay for any animations to complete
    await page.waitForTimeout(1000);

    // Capture screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      type: 'png',
    });

    console.log(`  ✓ Saved: ${config.filename}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed: ${(error as Error).message}`);
    return false;
  }
}

async function capturePublicScreenshots(context: BrowserContext): Promise<number> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  let captured = 0;
  const publicScreenshots = SCREENSHOTS.filter(s => !s.requiresAuth);

  for (const config of publicScreenshots) {
    if (await captureScreenshot(page, config)) {
      captured++;
    }
  }

  await page.close();
  return captured;
}

async function captureAuthenticatedScreenshots(context: BrowserContext): Promise<number> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  let captured = 0;
  const authScreenshots = SCREENSHOTS.filter(s => s.requiresAuth);

  console.log('\n--- Authenticated Screenshots ---');
  console.log('Note: These require you to be logged into the respective services.');
  console.log('If capture fails, manually log in and re-run the script.\n');

  for (const config of authScreenshots) {
    if (await captureScreenshot(page, config)) {
      captured++;
    }
  }

  await page.close();
  return captured;
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Executive Intent - Screenshot Capture');
  console.log('='.repeat(60));

  await ensureOutputDir();

  // Use persistent context to leverage existing browser sessions
  const userDataDir = path.join(process.cwd(), '.playwright-user-data');

  console.log('\nLaunching browser...');
  console.log('User data directory:', userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Show browser so user can log in if needed
    viewport: { width: 1280, height: 720 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    // Capture public screenshots first
    console.log('\n--- Public Screenshots ---');
    const publicCount = await capturePublicScreenshots(context);

    // Capture authenticated screenshots
    const authCount = await captureAuthenticatedScreenshots(context);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Screenshot Capture Complete');
    console.log('='.repeat(60));
    console.log(`Public screenshots: ${publicCount}/${SCREENSHOTS.filter(s => !s.requiresAuth).length}`);
    console.log(`Authenticated screenshots: ${authCount}/${SCREENSHOTS.filter(s => s.requiresAuth).length}`);
    console.log(`Total: ${publicCount + authCount}/${SCREENSHOTS.length}`);
    console.log(`\nOutput directory: ${OUTPUT_DIR}`);

    if (publicCount + authCount < SCREENSHOTS.length) {
      console.log('\nSome screenshots failed. Common fixes:');
      console.log('1. Log into the vendor dashboards in the browser that opened');
      console.log('2. Re-run this script');
      console.log('3. For persistent auth, use the same browser for subsequent runs');
    }
  } finally {
    await context.close();
  }
}

// Interactive mode - allow manual capture
async function interactiveMode(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Executive Intent - Interactive Screenshot Mode');
  console.log('='.repeat(60));

  await ensureOutputDir();

  const userDataDir = path.join(process.cwd(), '.playwright-user-data');

  console.log('\nLaunching browser in interactive mode...');
  console.log('Navigate to pages and press Enter in terminal to capture.');
  console.log('Type "quit" to exit.\n');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let screenshotCount = 0;

  const askQuestion = (): void => {
    rl.question('Filename (or "quit"): ', async (answer) => {
      if (answer.toLowerCase() === 'quit') {
        await context.close();
        rl.close();
        console.log(`\nCaptured ${screenshotCount} screenshots.`);
        return;
      }

      const filename = answer.endsWith('.png') ? answer : `${answer}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      try {
        await page.screenshot({ path: outputPath, fullPage: false });
        screenshotCount++;
        console.log(`✓ Saved: ${filename}`);
      } catch (error) {
        console.error(`✗ Failed: ${(error as Error).message}`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Parse CLI args
const args = process.argv.slice(2);
if (args.includes('--interactive') || args.includes('-i')) {
  interactiveMode().catch(console.error);
} else {
  main().catch(console.error);
}
