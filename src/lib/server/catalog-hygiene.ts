// canonical "same name?" check for global catalog products.
// used by the dedupe report and the create-time guard so both agree on what a duplicate is.
export function normalizeProductName(name: string): string {
	return (name || '')
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '') // strip diacritics (crème -> creme)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ') // punctuation -> space
		.trim()
		.replace(/\s+/g, ' '); // collapse whitespace
}
