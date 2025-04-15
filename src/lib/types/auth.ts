import type { CookieSerializeOptions } from 'cookie';

// export namespace Auth {

// }

export type Session = {
  userId?: string;
  opts: CookieSerializeOptions & { path: string; };
};

export type User = {
  userId: string;
  username: string;
  email: string;
  lastActivityDate?: Date | string;
  // user control
  roles: Role[];
  permissions: Permission[];
};

export type Permission = {
  permissionId: string,
  permissionName: string;
};

export type Role = {
  roleId: string,
  roleName: string;
};

export type UserRole = {
  userId: string,
  roleId: string;
};

export type RolePermission = {
  roleId: string,
  permissionId: string;
};