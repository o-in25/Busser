import type { CookieSerializeOptions } from 'cookie';

export type Result<T> = {
    data?: T,
    error?: {
        type?: number | string,
        message?: string
    }
}

export type Session = {
    userId?: string,
    opts: CookieSerializeOptions & { path: string }
}

export type User = {
    userId?: string,
    username?: string,
    password?: string
}