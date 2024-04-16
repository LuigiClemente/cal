import type { Frame, PlaywrightTestConfig } from '@playwright/test';
import { devices, expect } from '@playwright/test';
import dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

dotenv.config({ path: '.env' });

const outputDir = path.join(__dirname, 'test-results');
const isCI = !!process.env.CI;
const headless = isCI || !!process.env.PLAYWRIGHT_HEADLESS;

const config: PlaywrightTestConfig = {
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PWDEBUG ? 1 : os.cpus().length,
  timeout: isCI ? 60000 : 240000,
  maxFailures: headless ? 10 : undefined,
  fullyParallel: true,
  outputDir: path.join(outputDir, 'results'),
  reporter: [
    [isCI ? 'github' : 'list'],
    ['@deploysentinel/playwright'],
    ['html', { outputFolder: './test-results/reports/playwright-html-report', open: 'never' }],
    ['junit', { outputFile: './test-results/reports/results.xml' }],
  ],
  use: {
    baseURL: process.env.NEXT_PUBLIC_WEBAPP_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    headless,
    contextOptions: {
      permissions: ['clipboard-read', 'clipboard-write'],
    },
  },
  projects: setupProjects(),
  webServer: setupWebServer(),
};

function setupProjects() {
  const defaultChromium = {
    ...devices['Desktop Chrome'],
    locale: 'en-US',
    navigationTimeout: isCI ? 30000 : 120000,
  };
  const defaultTimeout = isCI ? 30000 : 120000;

  return [
    {
      name: '@calcom/web',
      testDir: './apps/web/playwright',
      testMatch: /.*\.e2e\.tsx?/,
      expect: { timeout: defaultTimeout },
      use: defaultChromium,
    },
    {
      name: '@calcom/app-store',
      testDir: './packages/app-store/',
      testMatch: /.*\.e2e\.tsx?/,
      expect: { timeout: defaultTimeout },
      use: defaultChromium,
    },
    {
      name: '@calcom/embed-core',
      testDir: './packages/embeds/embed-core/',
      testMatch: /.*\.e2e\.tsx?/,
      expect: { timeout: defaultTimeout },
      use: { ...defaultChromium, baseURL: 'http://localhost:3100/' },
    },
    {
      name: '@calcom/embed-react',
      testDir: './packages/embeds/embed-react/',
      testMatch: /.*\.e2e\.tsx?/,
      expect: { timeout: defaultTimeout },
      use: { ...defaultChromium, baseURL: 'http://localhost:3101/' },
    },
  ];
}

function setupWebServer() {
  const webServerConfig = [
    {
      command: 'NEXT_PUBLIC_IS_E2E=1 NODE_OPTIONS="--dns-result-order=ipv4first" yarn workspace @calcom/web start -p 3000',
      port: 3000,
      timeout: 60000,
      reuseExistingServer: !isCI,
    },
  ];

  if (process.argv.some(a => a.startsWith('--project=@calcom/embed-core'))) {
    ensureAppServerIsReadyToServeEmbed(webServerConfig[0]);
    webServerConfig.push({
      command: 'yarn workspace @calcom/embed-core dev',
      port: 3100,
      timeout: 60000,
      reuseExistingServer: !isCI,
    });
  }

  if (process.argv.some(a => a.startsWith('--project=@calcom/embed-react'))) {
    ensureAppServerIsReadyToServeEmbed(webServerConfig[0]);
    webServerConfig.push({
      command: 'yarn workspace @calcom/embed-react dev',
      port: 3101,
      timeout: 60000,
      reuseExistingServer: !isCI,
    });
  }

  return webServerConfig;
}

function ensureAppServerIsReadyToServeEmbed(webServer: { port?: number; url?: string }) {
  delete webServer.port;
  webServer.url = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/embed/embed.js`;
  console.log('Ensuring that /embed/embed.js is 200 before starting tests');
}

export default config;
