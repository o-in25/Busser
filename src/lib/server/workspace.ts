// workspace.ts - backwards compatibility layer
// new code should import from repositories directly

import { workspaceRepo } from './auth';

// re-export repository for direct access
export { workspaceRepo };

// workspace functions (delegate to repository)
export const hasWorkspaceAccess = workspaceRepo.hasWorkspaceAccess.bind(workspaceRepo);
export const getUserWorkspaces = workspaceRepo.getUserWorkspaces.bind(workspaceRepo);
export const getWorkspace = workspaceRepo.getWorkspace.bind(workspaceRepo);
export const createWorkspace = workspaceRepo.createWorkspace.bind(workspaceRepo);
