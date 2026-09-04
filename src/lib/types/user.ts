// user management types

import type { WorkspaceRole } from './workspace';

export type User = {
	userId: string;
	username: string;
	email: string;
	createdDate?: Date | string;
	lastActivityDate?: Date | string;
	roles: Role[];
	permissions: Permission[];
	verified: number;
	needsOnboarding: number;
	avatarImageUrl?: string;
};

export type Role = {
	roleId: string;
	roleName: string;
};

export type Permission = {
	permissionId: string;
	permissionName: string;
};

export type UserRole = {
	userId: string;
	roleId: string;
};

export type RolePermission = {
	roleId: string;
	permissionId: string;
};

export type Invitation = {
	invitationId: number;
	userId: string | null;
	invitationCode: string;
	email: string | null;
	createdAt: Date;
	issuedAt: Date | null;
	expiresAt: Date | null;
	lastSentAt: Date | null;
	workspaceId: string | null;
	workspaceRole: WorkspaceRole | null;
};

export type InvitationRequest = {
	invitationRequestId: number;
	email: string;
	message: string | null;
	status: 'pending' | 'fulfilled' | 'rejected';
	createdAt: Date;
	resolvedAt: Date | null;
	resolvedBy: string | null;
};

export interface UserFavorite {
	favoriteId: string;
	userId: string;
	recipeId: number;
	workspaceId: string;
	createdDate: Date;
}

export type AppSetting = {
	settingKey: string;
	settingValue: string | null;
};

export interface RevealParams {
	delay?: number;
	threshold?: number;
}
