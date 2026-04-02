// workspace service
import { DbProvider } from './db';
import { WorkspaceRepository } from './repositories/workspace.repository';

const { USER_TABLE } = process.env;
const db = new DbProvider(USER_TABLE || '');
const workspaceRepo = new WorkspaceRepository(db);

export { workspaceRepo };

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

export type { WorkspaceRole } from './repositories/workspace.repository';

export async function canModifyWorkspace(userId: string, workspaceId: string): Promise<boolean> {
	const role = await hasWorkspaceAccess(userId, workspaceId);
	return role === 'owner' || role === 'editor';
}

export async function isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
	const role = await hasWorkspaceAccess(userId, workspaceId);
	return role === 'owner';
}

export function getGlobalWorkspace(): string {
	const id = process.env.GLOBAL_WORKSPACE;
	if (!id) throw new Error('GLOBAL_WORKSPACE env var is not set');
	return id;
}
