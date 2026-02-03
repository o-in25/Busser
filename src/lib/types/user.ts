// user management types

export type User = {
	userId: string;
	username: string;
	email: string;
	lastActivityDate?: Date | string;
	roles: Role[];
	permissions: Permission[];
	verified: number;
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
	workspaceRole: 'owner' | 'editor' | 'viewer' | null;
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

export interface Workspace {
	workspaceId: string;
	workspaceName: string;
	workspaceType: 'personal' | 'shared';
	createdDate: Date;
	createdBy: string;
}

export interface WorkspaceUser {
	workspaceId: string;
	userId: string;
	workspaceRole: 'owner' | 'editor' | 'viewer';
	joinedDate: Date;
}

export interface UserFavorite {
	favoriteId: string;
	userId: string;
	recipeId: number;
	workspaceId: string;
	createdDate: Date;
}
