export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

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
	workspaceRole: WorkspaceRole;
	joinedDate: Date;
}

export type WorkspaceWithRole = Workspace & {
	workspaceRole: WorkspaceRole;
};

export const roleCanModify = (role: WorkspaceRole | null | undefined): boolean =>
	role === 'owner' || role === 'editor';
export const roleIsOwner = (role: WorkspaceRole | null | undefined): boolean => role === 'owner';
