// auth.ts - backwards compatibility layer
// new code should import from repositories directly

import { DbProvider } from './db';
import { AuthRepository } from './repositories/auth.repository';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';

// singleton instances
const db = new DbProvider('user_t');
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
export const getPendingInvitationRequestCount = userRepo.getPendingInvitationRequestCount.bind(userRepo);
export const fulfillInvitationRequest = userRepo.fulfillInvitationRequest.bind(userRepo);
export const rejectInvitationRequest = userRepo.rejectInvitationRequest.bind(userRepo);

// workspace functions (delegate to workspace repository)
export const hasWorkspaceAccess = workspaceRepo.hasWorkspaceAccess.bind(workspaceRepo);
export const getUserWorkspaces = workspaceRepo.getUserWorkspaces.bind(workspaceRepo);
export const getWorkspace = workspaceRepo.getWorkspace.bind(workspaceRepo);
export const createWorkspace = workspaceRepo.createWorkspace.bind(workspaceRepo);
