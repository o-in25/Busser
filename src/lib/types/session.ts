import type { CookieSerializeOptions } from 'cookie';
export type Session = {
    userId?: string,
    opts: CookieSerializeOptions & { path: string }
    // {
    //     // path: string,
    //     // httpOnly: boolean,
    //     // sameSite: string,
    //     // secure: boolean,
    //     // maxAge: number 
    // }
}