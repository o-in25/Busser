import type { CookieSerializeOptions } from 'cookie';
export type Result<T> = {
    data?: T,
    error?: Error;
};

export type Session = {
    userId?: string,
    opts: CookieSerializeOptions & { path: string; };
};

export type User = {
    userId?: string,
    username?: string,
    email?: string;
};