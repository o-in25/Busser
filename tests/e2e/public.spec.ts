import { expect, test } from '@playwright/test';

const publicRoutes = [
	{ path: '/', title: /Busser - Home Bar Management/ },
	{ path: '/login', title: /Log In - Busser/ },
	{ path: '/signup', title: /Sign Up - Busser/ },
	{ path: '/about', title: /About - Busser/ },
	{ path: '/privacy', title: /Privacy Policy - Busser/ },
	{ path: '/terms', title: /Terms of Service - Busser/ },
	{ path: '/cookies', title: /Cookie Policy - Busser/ },
];

for (const { path, title } of publicRoutes) {
	test(`public page ${path} renders`, async ({ page }) => {
		await page.goto(path);
		await expect(page).toHaveTitle(title);
	});
}
