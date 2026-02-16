// user.ts - backwards compatibility layer
// new code should import from repositories directly

import { userRepo } from './auth';

// re-export repositories for direct access
export { userRepo };

// user CRUD (delegate to repository)
export const getUsers = userRepo.findAll.bind(userRepo);
export const getUser = userRepo.findById.bind(userRepo);
export const addUser = userRepo.create.bind(userRepo);
export const editUser = userRepo.update.bind(userRepo);
export const deleteUser = userRepo.delete.bind(userRepo);
export const getUsersInOwnedWorkspaces = userRepo.getUsersInOwnedWorkspaces.bind(userRepo);
export const getInvitableUsers = userRepo.getInvitableUsers.bind(userRepo);

// role management (delegate to repository)
export const createRole = userRepo.createRole.bind(userRepo);
export const roleSelect = userRepo.getRoleOptions.bind(userRepo);
export const getGrants = userRepo.getGrants.bind(userRepo);
export const updateGrants = userRepo.updateGrants.bind(userRepo);

// registration flow (delegate to repository)
export const registerUser = userRepo.register.bind(userRepo);
export const verifyUser = userRepo.verify.bind(userRepo);
export const resendVerificationEmail = userRepo.resendVerificationEmail.bind(userRepo);
export const resendVerificationEmailByEmail =
	userRepo.resendVerificationEmailByEmail.bind(userRepo);
export const requestPasswordReset = userRepo.requestPasswordReset.bind(userRepo);

// invitation management (delegate to repository)
export const createInvitation = userRepo.createInvitation.bind(userRepo);
export const getWorkspaceInvitations = userRepo.getWorkspaceInvitations.bind(userRepo);
export const deleteInvitation = userRepo.deleteInvitation.bind(userRepo);
export const getInvitationByCode = userRepo.getInvitationByCode.bind(userRepo);
export const acceptWorkspaceInvitation = userRepo.acceptWorkspaceInvitation.bind(userRepo);

// preferred workspace (delegate to repository)
export const getPreferredWorkspaceId = userRepo.getPreferredWorkspaceId.bind(userRepo);
export const setPreferredWorkspaceId = userRepo.setPreferredWorkspaceId.bind(userRepo);
