// image compression — no env/sveltekit imports so standalone scripts (backfill) can use it too
import sharp from 'sharp';

// resize + re-encode to webp so we store small files instead of multi-mb originals.
// svgs pass through untouched (vector — re-rastering would wreck them), and we never upscale.
export async function compressImage(
	input: Buffer,
	{ maxDimension = 1600, quality = 82 } = {}
): Promise<{ data: Buffer; contentType: string }> {
	const meta = await sharp(input).metadata();
	if (meta.format === 'svg') {
		return { data: input, contentType: 'image/svg+xml' };
	}

	const data = await sharp(input)
		.resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality })
		.toBuffer();

	return { data, contentType: 'image/webp' };
}
