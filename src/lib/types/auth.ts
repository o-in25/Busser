// authentication types
import type { CookieSerializeOptions } from 'cookie';

// re-export user types for backwards compatibility
export * from './user';

export type Session = {
	userId?: string;
	opts: CookieSerializeOptions & { path: string };
};

export type RegistrationToken = {
	userId: string;
	iat: number;
	exp: number;
};

export type PasswordResetToken = {
	userId: string;
	email: string;
	type: 'password-reset';
	iat: number;
	exp: number;
};

export type TokenResult<T> = {
	valid: boolean;
	expired: boolean;
	payload?: T;
};
