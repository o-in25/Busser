// auth.ts - backwards compatibility layer
// new code should import from repositories directly

import { DbProvider } from './db';
import { AuthRepository } from './repositories/auth.repository';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
const { USER_TABLE } = process.env;

// singleton instances
const db = new DbProvider(USER_TABLE || '');
const authRepo = new AuthRepository(db);
const userRepo = new UserRepository(db, authRepo);
const workspaceRepo = new WorkspaceRepository(db);

// export repositories for direct access
export { authRepo, userRepo, workspaceRepo };

// auth functions (delegate to repository)
export const verifyToken = authRepo.verifyToken.bind(authRepo);
export const signToken = authRepo.signToken.bind(authRepo);
export const hashPassword = authRepo.hashPassword.bind(authRepo);
export const authenticate = authRepo.authenticate.bind(authRepo);
export const verifyRegistrationToken = authRepo.verifyRegistrationToken.bind(authRepo);
export const verifyPasswordResetToken = authRepo.verifyPasswordResetToken.bind(authRepo);
export const resetPasswordWithToken = authRepo.resetPasswordWithToken.bind(authRepo);
export const resetPassword = authRepo.resetPassword.bind(authRepo);

// login needs getUser, so we wrap it
export async function login(username: string, password: string) {
	return authRepo.login(username, password, userRepo.findById.bind(userRepo));
}

// invitation functions (delegate to user repository)
export const getInvitations = userRepo.getInvitations.bind(userRepo);
export const createInvitation = userRepo.createInvitation.bind(userRepo);
export const deleteInvitation = userRepo.deleteInvitation.bind(userRepo);

// invitation request functions (delegate to user repository)
export const createInvitationRequest = userRepo.createInvitationRequest.bind(userRepo);
export const getInvitationRequests = userRepo.getInvitationRequests.bind(userRepo);
export const getPendingInvitationRequestCount =
	userRepo.getPendingInvitationRequestCount.bind(userRepo);
export const fulfillInvitationRequest = userRepo.fulfillInvitationRequest.bind(userRepo);
export const rejectInvitationRequest = userRepo.rejectInvitationRequest.bind(userRepo);

// workspace functions (delegate to workspace repository)
export const hasWorkspaceAccess = workspaceRepo.hasWorkspaceAccess.bind(workspaceRepo);
export const getUserWorkspaces = workspaceRepo.getUserWorkspaces.bind(workspaceRepo);
export const getWorkspace = workspaceRepo.getWorkspace.bind(workspaceRepo);
export const getWorkspaceInfo = workspaceRepo.getWorkspaceInfo.bind(workspaceRepo);
export const createWorkspace = workspaceRepo.createWorkspace.bind(workspaceRepo);
export const getAllWorkspaces = workspaceRepo.getAllWorkspaces.bind(workspaceRepo);
export const updateWorkspace = workspaceRepo.updateWorkspace.bind(workspaceRepo);
export const deleteWorkspace = workspaceRepo.deleteWorkspace.bind(workspaceRepo);
export const getWorkspaceMembers = workspaceRepo.getWorkspaceMembers.bind(workspaceRepo);
export const addWorkspaceMember = workspaceRepo.addWorkspaceMember.bind(workspaceRepo);
export const removeWorkspaceMember = workspaceRepo.removeWorkspaceMember.bind(workspaceRepo);
export const updateWorkspaceMemberRole =
	workspaceRepo.updateWorkspaceMemberRole.bind(workspaceRepo);

// re-export workspace role type
export type { WorkspaceRole } from './repositories/workspace.repository';

// check if user can modify resources in a workspace (requires editor or owner)
export async function canModifyWorkspace(userId: string, workspaceId: string): Promise<boolean> {
	const role = await hasWorkspaceAccess(userId, workspaceId);
	return role === 'owner' || role === 'editor';
}

// check if user is workspace owner
export async function isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
	const role = await hasWorkspaceAccess(userId, workspaceId);
	return role === 'owner';
}

// check if user has a global permission
export function hasGlobalPermission(
	user: { permissions?: Array<{ permissionName: string }> } | undefined,
	permission: string
): boolean {
	return user?.permissions?.some((p) => p.permissionName === permission) ?? false;
}
