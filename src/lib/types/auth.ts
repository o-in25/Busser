import type { CookieSerializeOptions } from 'cookie';

// export namespace Auth {

// }

export type Session = {
  userId?: string;
  opts: CookieSerializeOptions & {path: string};
};

export type User = {
  userId: string;
  username: string;
  email: string;
  lastActivityDate?: Date | string;
  // user control
  roles: string[];
  permissions: string[];
};