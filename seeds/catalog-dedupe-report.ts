import 'dotenv/config';
import knex from 'knex';
import config from '../knexfile';

import { normalizeProductName } from '../src/lib/server/catalog-hygiene';

// read-only: proposes duplicate global products (and whitespace nits) for owner review, never writes.
// run: pnpm catalog:dedupe:report
const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';

type Row = {
	ProductId: number;
	ProductName: string;
	CategoryId: number;
	CategoryName: string;
	steps: number;
	stocked: number;
};

async function main() {
	const db = knex(config.core);
	try {
		const rows = (await db('product as p')
			.join('category as c', 'p.CategoryId', 'c.CategoryId')
			.where('p.WorkspaceId', WORKSPACE)
			.where('p.Retired', false)
			.select(
				'p.ProductId',
				'p.ProductName',
				'p.CategoryId',
				'c.CategoryName',
				db.raw('(SELECT COUNT(*) FROM recipestep rs WHERE rs.ProductId = p.ProductId) AS steps'),
				db.raw(
					'(SELECT COUNT(*) FROM workspacestock ws WHERE ws.ProductId = p.ProductId) AS stocked'
				)
			)) as Row[];

		// tier 1: clusters that normalize to the same name within a category (a real merge candidate).
		// category-scoped so distinct brands sharing a category aren't flagged as dupes.
		const clusters = new Map<string, Row[]>();
		for (const r of rows) {
			const key = `${r.CategoryId}::${normalizeProductName(r.ProductName)}`;
			(clusters.get(key) ?? clusters.set(key, []).get(key)!).push(r);
		}
		const dupes = [...clusters.values()].filter((g) => g.length > 1);

		console.log(`\nglobal catalog: ${rows.length} active products in "${WORKSPACE}"\n`);

		console.log(`== tier 1: duplicate clusters (same category + normalized name) ==`);
		if (dupes.length === 0) {
			console.log('  none — nothing to merge.\n');
		} else {
			for (const g of dupes) {
				console.log(`  ${g[0].CategoryName} / "${normalizeProductName(g[0].ProductName)}"`);
				for (const r of g)
					console.log(
						`    - id=${r.ProductId} "${r.ProductName}" (steps=${r.steps}, stocked=${r.stocked})`
					);
			}
			console.log('');
		}

		// hygiene flags: raw name differs from a trimmed/collapsed form.
		const dirty = rows.filter((r) => r.ProductName !== r.ProductName.trim().replace(/\s+/g, ' '));
		console.log(`== hygiene: stray/collapsible whitespace ==`);
		if (dirty.length === 0) console.log('  none.\n');
		else {
			for (const r of dirty) console.log(`  - id=${r.ProductId} ${JSON.stringify(r.ProductName)}`);
			console.log('');
		}
	} finally {
		await db.destroy();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
