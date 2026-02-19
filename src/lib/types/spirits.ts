export type SpiritSlug = 'whiskey' | 'gin' | 'vodka' | 'tequila' | 'rum' | 'brandy';

export type AccentColor = {
	bg: string;
	text: string;
	border: string;
	gradient: string;
	hex: string;
};

export type SpiritOverview = {
	intro: string;
	history: string;
	production: string;
};

export type SpiritSubcategory = {
	name: string;
	description: string;
	examples: string[];
};

export type SpiritRegion = {
	name: string;
	description: string;
	countryCode: string;
	highlights: string[];
};

export type SpiritSource = {
	title: string;
	url: string;
	accessedDate: string;
};

export type SpiritContent = {
	slug: SpiritSlug;
	recipeCategoryId: number;
	displayName: string;
	accentColor: AccentColor;
	overview: SpiritOverview;
	subcategories: SpiritSubcategory[];
	regions: SpiritRegion[];
	funFact: string;
	sources: SpiritSource[];
};
