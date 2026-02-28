import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'static', 'favicon.png');
const outDir = join(root, 'static', 'icons');

// sample the background color from the source favicon (top-left pixel)
const { data, info } = await sharp(source).raw().toBuffer({ resolveWithObject: true });
const [r, g, b] = [data[0], data[1], data[2]];
const BRAND_BG = { r, g, b, alpha: 1 };
const brandHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
console.log(`sampled background color: ${brandHex}`);

// ios splash screen sizes (logical px × device pixel ratio)
const splashScreens = [
	{ w: 1170, h: 2532, name: 'splash-1170x2532.png' }, // iPhone 12/13/14
	{ w: 1179, h: 2556, name: 'splash-1179x2556.png' }, // iPhone 14 Pro/15/16
	{ w: 1290, h: 2796, name: 'splash-1290x2796.png' }, // iPhone 14 Pro Max/15 Plus/16 Plus
	{ w: 1320, h: 2868, name: 'splash-1320x2868.png' }, // iPhone 16 Pro Max
];

await mkdir(outDir, { recursive: true });

// standard pwa icons
await sharp(source).resize(192, 192).png().toFile(join(outDir, 'icon-192x192.png'));
await sharp(source).resize(512, 512).png().toFile(join(outDir, 'icon-512x512.png'));
await sharp(source).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png'));

console.log('generated PWA icons');

// splash screens — logo centered on brand background
for (const { w, h, name } of splashScreens) {
	const logoSize = Math.round(Math.min(w, h) * 0.3);
	const logo = await sharp(source).resize(logoSize, logoSize).png().toBuffer();

	await sharp({
		create: { width: w, height: h, channels: 4, background: BRAND_BG },
	})
		.composite([{ input: logo, gravity: 'centre' }])
		.png()
		.toFile(join(outDir, name));

	console.log(`generated ${name}`);
}

console.log('done');
