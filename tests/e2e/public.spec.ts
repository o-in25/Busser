import { expect, test } from '@playwright/test';

const staticPages = [
	{ path: '/login', title: /Log In - Busser/ },
	{ path: '/about', title: /About - Busser/ },
	{ path: '/privacy', title: /Privacy Policy - Busser/ },
	{ path: '/terms', title: /Terms of Service - Busser/ },
	{ path: '/cookies', title: /Cookie Policy - Busser/ },
];

const dbPages = [
	{ path: '/', title: /Busser - Home Bar Management/ },
	{ path: '/signup', title: /Sign Up - Busser/ },
];

for (const { path, title } of staticPages) {
	test(`public page ${path} renders`, async ({ page }) => {
		await page.goto(path);
		await expect(page).toHaveTitle(title);
	});
}

for (const { path, title } of dbPages) {
	test(`public page ${path} renders`, async ({ page }) => {
		test.skip(!!process.env.E2E_NO_DB, 'needs a database (deferred to the db cutover)');
		await page.goto(path);
		await expect(page).toHaveTitle(title);
	});
}
