import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = !!process.env.CI;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	reporter: isCI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
	],
	webServer: {
		command: isCI ? 'pnpm build && pnpm preview --port ' + PORT : 'pnpm dev --port ' + PORT,
		port: PORT,
		reuseExistingServer: !isCI,
		timeout: 120_000,
	},
});
