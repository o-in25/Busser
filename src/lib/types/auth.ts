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
  verified: number;
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

export type Invitation = {
  id: number;   
  code: string;          
  createdAt: Date;      
  usedAt: Date | null; 
  usedBy: string | null; 
  email: string;          
  expiresAt: Date;   
}