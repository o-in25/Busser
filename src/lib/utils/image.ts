// rewrites stored gcs image urls through cloudflare's on-the-fly resizer
// (/cdn-cgi/image). resize + re-encode (avif/webp via format=auto) happens at
// the edge and is cached there — the db keeps storing full-size gcs urls untouched.

// absolute so it works both in prod (served from the zone) and in local dev
// (localhost isn't behind cloudflare, so an origin-relative path wouldn't resolve).
const CDN_ZONE = 'https://busserapp.com';

// default responsive ladder — covers thumbnails through full-bleed heroes
export const DEFAULT_WIDTHS = [256, 384, 512, 768, 1024, 1600];

// only gcs-backed rasters go through the resizer; svg is vector and data/blob
// previews and static assets pass through untouched.
function transformable(url?: string | null): url is string {
	if (!url) return false;
	if (!url.startsWith('https://storage.googleapis.com/')) return false;
	if (url.endsWith('.svg')) return false;
	return true;
}

type Opts = { quality?: number; fit?: 'cover' | 'contain' | 'scale-down' };

export function cdnSrc(url: string, width: number, { quality = 82, fit = 'cover' }: Opts = {}): string {
	if (!transformable(url)) return url;
	return `${CDN_ZONE}/cdn-cgi/image/width=${width},quality=${quality},format=auto,fit=${fit}/${url}`;
}

export function cdnSrcset(url?: string | null, widths = DEFAULT_WIDTHS, opts?: Opts): string | undefined {
	if (!transformable(url)) return undefined;
	return widths.map((w) => `${cdnSrc(url, w, opts)} ${w}w`).join(', ');
}
