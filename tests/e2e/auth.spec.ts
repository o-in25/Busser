import { expect, test } from '@playwright/test';

// logged-out visitors to protected routes get bounced to the landing page (hooks.server.ts)
const protectedRoutes = ['/settings', '/workspace'];

for (const route of protectedRoutes) {
	test(`${route} redirects logged-out visitors to landing`, async ({ page }) => {
		await page.goto(route);
		await expect(page).toHaveURL('/');
	});
}
