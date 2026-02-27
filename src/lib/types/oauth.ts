export const validProviders = ['google', 'apple'] as const;

export type OAuthProvider = (typeof validProviders)[number];

export type OAuthProfile = {
	provider: OAuthProvider;
	providerUserId: string;
	email: string;
	name: string | null;
	avatarUrl: string | null;
};

export type OAuthState = {
	token: string;
	inviteCode: string | null;
};
