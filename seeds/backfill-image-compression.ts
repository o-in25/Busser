/**
 * backfill: re-encode existing gcs images to webp in place.
 *
 * enumerates the bucket directly (not the upload table) so untracked/legacy images get caught too,
 * and overwrites each object under its identical name — so no db/url references need updating.
 * idempotent: skips objects already webp/svg and anything that wouldn't get smaller.
 *
 *   pnpm backfill:images:dry              # report only, no writes
 *   pnpm backfill:images                  # re-encode in place
 *   pnpm backfill:images -- --prefix catalog/   # scope to one folder
 */
import 'dotenv/config';
import { Storage } from '@google-cloud/storage';

import { compressImage } from '../src/lib/server/image';

const DRY_RUN = process.argv.includes('--dry-run');
const prefixArg = process.argv.indexOf('--prefix');
const PREFIX = prefixArg !== -1 ? process.argv[prefixArg + 1] : undefined;

const decode = (s: string) => (s ? Buffer.from(s, 'base64').toString() : '{}');

function fmt(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
	const creds = JSON.parse(decode(process.env.GOOGLE_SERVICE_KEY || ''));
	const storage = new Storage({
		credentials: { client_email: creds.client_email, private_key: creds.private_key },
	});
	const bucketName = process.env.BUCKET || '';
	if (!bucketName) throw new Error('BUCKET is not set');
	const bucket = storage.bucket(bucketName);

	console.log(
		`${DRY_RUN ? '[dry-run] ' : ''}backfill on bucket "${bucketName}"${PREFIX ? ` prefix "${PREFIX}"` : ''}\n`
	);

	const [files] = await bucket.getFiles({ prefix: PREFIX });

	let converted = 0;
	let skipped = 0;
	let failed = 0;
	let bytesBefore = 0;
	let bytesAfter = 0;

	for (const file of files) {
		const contentType = file.metadata.contentType || '';
		const { name } = file;
		const oldSize = parseInt(file.metadata.size?.toString() || '0');

		// leave already-optimal objects alone. don't gate on content-type starting with `image/` —
		// legacy uploads carry a malformed `image.jpeg` type (no slash), so we let sharp decide what's
		// actually a decodable raster below and skip anything it can't parse.
		if (contentType === 'image/webp' || name.endsWith('.webp')) {
			skipped++;
			continue;
		}
		if (contentType.includes('svg') || name.endsWith('.svg')) {
			skipped++;
			continue;
		}

		try {
			const [buf] = await file.download();

			let out: { data: Buffer; contentType: string };
			try {
				out = await compressImage(buf);
			} catch {
				// not a decodable image (text/sql/etc) — skip
				skipped++;
				continue;
			}
			const { data, contentType: newType } = out;

			// no gain (already small/optimized) or a passthrough (e.g. svg) — don't rewrite
			if (newType !== 'image/webp' || data.length >= oldSize) {
				skipped++;
				continue;
			}

			bytesBefore += oldSize;
			bytesAfter += data.length;
			converted++;

			console.log(`  ${file.name}: ${fmt(oldSize)} -> ${fmt(data.length)}`);

			if (!DRY_RUN) {
				await file.save(data, { contentType: newType, resumable: false });
			}
		} catch (err) {
			failed++;
			console.error(`  FAILED ${file.name}:`, err instanceof Error ? err.message : err);
		}
	}

	const saved = bytesBefore - bytesAfter;
	const pct = bytesBefore ? ((saved / bytesBefore) * 100).toFixed(1) : '0';
	console.log(
		`\n${DRY_RUN ? '[dry-run] would convert' : 'converted'} ${converted}, skipped ${skipped}, failed ${failed}`
	);
	console.log(`total: ${fmt(bytesBefore)} -> ${fmt(bytesAfter)}  (saved ${fmt(saved)}, ${pct}%)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
