import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'static', 'icons');
const logoSrc = path.join(__dirname, '..', 'src', 'lib', 'assets', 'logo.png');

const lightBg = '#fafafa';
const darkBg = '#08080f';

const iconSizes = [
	{ name: 'icon-192x192.png', size: 192 },
	{ name: 'icon-512x512.png', size: 512 },
	{ name: 'apple-touch-icon.png', size: 180 },
];

// clear existing generated files
const existing = fs.readdirSync(iconsDir);
for (const file of existing) {
	fs.unlinkSync(path.join(iconsDir, file));
	console.log(`removed ${file}`);
}

// trim whitespace then resize to fill icon width
const trimmedLogo = await sharp(logoSrc).trim().toBuffer();

// subtle radial gradient for light icons (matches app light theme)
function lightGradientSvg(size) {
	return Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<radialGradient id="a" cx="20%" cy="40%" r="80%">
				<stop offset="0%" stop-color="rgba(253,111,148,0.12)" />
				<stop offset="50%" stop-color="rgba(253,111,148,0)" />
			</radialGradient>
			<radialGradient id="b" cx="80%" cy="20%" r="60%">
				<stop offset="0%" stop-color="rgba(165,125,213,0.10)" />
				<stop offset="50%" stop-color="rgba(165,125,213,0)" />
			</radialGradient>
		</defs>
		<rect width="${size}" height="${size}" fill="${lightBg}" />
		<rect width="${size}" height="${size}" fill="url(#a)" />
		<rect width="${size}" height="${size}" fill="url(#b)" />
	</svg>`);
}

// generate app icons (light and dark variants)
for (const { name, size } of iconSizes) {
	const logoResized = await sharp(trimmedLogo)
		.resize(size, size, { fit: 'inside' })
		.toBuffer();

	// light variant with gradient
	const lightBgLayer = await sharp(lightGradientSvg(size)).png().toBuffer();
	await sharp(lightBgLayer)
		.composite([{ input: logoResized, gravity: 'centre' }])
		.png()
		.toFile(path.join(iconsDir, name));

	// dark variant
	const darkName = name.replace('.png', '-dark.png');
	await sharp({ create: { width: size, height: size, channels: 4, background: darkBg } })
		.composite([{ input: logoResized, gravity: 'centre' }])
		.png()
		.toFile(path.join(iconsDir, darkName));

	console.log(`created ${name} (light + dark)`);
}

console.log('done — all icons generated');
