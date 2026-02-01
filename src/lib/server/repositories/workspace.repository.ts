// workspace management repository
import type { QueryResult, Workspace, WorkspaceUser } from '$lib/types';

import { DbProvider } from '../db';
import { Logger } from '../logger';
import { BaseRepository, marshalToType } from './base.repository';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export type WorkspaceWithRole = Workspace & {
	workspaceRole: WorkspaceRole;
};

export class WorkspaceRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	// check if a user has access to a workspace
	async hasWorkspaceAccess(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
		try {
			const dbResult = await this.db
				.table<WorkspaceUser>('workspaceUser')
				.select('workspaceRole')
				.where({ userId, workspaceId })
				.first();

			if (!dbResult) return null;

			const workspaceUser = this.marshalToType<Pick<WorkspaceUser, 'workspaceRole'>>(dbResult);
			return workspaceUser.workspaceRole;
		} catch (error: any) {
			console.error('Error checking workspace access:', error.message);
			return null;
		}
	}

	// get all workspaces a user belongs to
	async getUserWorkspaces(userId: string): Promise<QueryResult<WorkspaceWithRole[]>> {
		try {
			const dbResult = await this.db
				.table('workspace as w')
				.join('workspaceUser as wu', 'w.workspaceId', 'wu.workspaceId')
				.where('wu.userId', userId)
				.select(
					'w.workspaceId',
					'w.workspaceName',
					'w.workspaceType',
					'w.createdDate',
					'w.createdBy',
					'wu.workspaceRole'
				)
				.orderBy('w.workspaceName', 'asc');

			const workspaces = marshalToType<WorkspaceWithRole[]>(dbResult);

			return { status: 'success', data: workspaces };
		} catch (error: any) {
			console.error('Error getting user workspaces:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// get basic workspace info without permission check (for invitations)
	async getWorkspaceInfo(workspaceId: string): Promise<QueryResult<Workspace>> {
		try {
			const dbResult = await this.db
				.table<Workspace>('workspace')
				.select('workspaceId', 'workspaceName', 'workspaceType', 'createdDate', 'createdBy')
				.where({ workspaceId })
				.first();

			if (!dbResult) {
				return { status: 'error', error: 'Workspace not found.' };
			}

			const workspace = this.marshalToType<Workspace>(dbResult);
			return { status: 'success', data: workspace };
		} catch (error: any) {
			console.error('Error getting workspace info:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// get a single workspace with permission check
	async getWorkspace(userId: string, workspaceId: string): Promise<QueryResult<WorkspaceWithRole>> {
		try {
			const role = await this.hasWorkspaceAccess(userId, workspaceId);
			if (!role) {
				return { status: 'error', error: 'Access denied to workspace.' };
			}

			const dbResult = await this.db
				.table<Workspace>('workspace')
				.select('workspaceId', 'workspaceName', 'workspaceType', 'createdDate', 'createdBy')
				.where({ workspaceId })
				.first();

			if (!dbResult) {
				return { status: 'error', error: 'Workspace not found.' };
			}

			const workspace = this.marshalToType<Workspace>(dbResult);

			return {
				status: 'success',
				data: { ...workspace, workspaceRole: role },
			};
		} catch (error: any) {
			console.error('Error getting workspace:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// create a new workspace and add the creator as owner
	async createWorkspace(
		userId: string,
		workspaceName: string,
		workspaceType: 'personal' | 'shared'
	): Promise<QueryResult<WorkspaceWithRole>> {
		try {
			const workspace = await this.db.query.transaction(async (trx) => {
				// generate workspace ID (slug from name + random suffix)
				const slug = workspaceName
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '')
					.substring(0, 40);
				const suffix = Math.random().toString(36).substring(2, 10);
				const workspaceId = `${slug}-${suffix}`;

				// create workspace
				await trx('workspace').insert({
					workspaceId,
					workspaceName: workspaceName.trim(),
					workspaceType,
					createdDate: Logger.now(),
					createdBy: userId,
				});

				// add creator as owner
				await trx('workspaceUser').insert({
					workspaceId,
					userId,
					workspaceRole: 'owner',
					joinedDate: Logger.now(),
				});

				// fetch created workspace
				const dbResult = await trx('workspace')
					.select('workspaceId', 'workspaceName', 'workspaceType', 'createdDate', 'createdBy')
					.where({ workspaceId })
					.first();

				return this.marshalToType<Workspace>(dbResult);
			});

			return {
				status: 'success',
				data: { ...workspace, workspaceRole: 'owner' },
			};
		} catch (error: any) {
			console.error('Error creating workspace:', error.message);

			if (error.message?.includes('ER_DUP_ENTRY')) {
				return { status: 'error', error: 'A workspace with this name already exists.' };
			}

			return { status: 'error', error: 'Failed to create workspace.' };
		}
	}

	// get all workspaces (admin only - no user filter)
	async getAllWorkspaces(): Promise<QueryResult<Workspace[]>> {
		try {
			const dbResult = await this.db
				.table<Workspace>('workspace')
				.select('workspaceId', 'workspaceName', 'workspaceType', 'createdDate', 'createdBy')
				.orderBy('workspaceName', 'asc');

			const workspaces = marshalToType<Workspace[]>(dbResult);

			return { status: 'success', data: workspaces };
		} catch (error: any) {
			console.error('Error getting all workspaces:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// update a workspace (name and type only)
	async updateWorkspace(
		workspaceId: string,
		workspaceName: string,
		workspaceType: 'personal' | 'shared'
	): Promise<QueryResult<Workspace>> {
		try {
			// prevent updating the global workspace type
			if (workspaceId === 'ws-global-catalog') {
				// allow name change but not type change for global workspace
				const existing = await this.db
					.table<Workspace>('workspace')
					.select('workspaceType')
					.where({ workspaceId })
					.first();

				if (existing && workspaceType !== existing.workspaceType) {
					return { status: 'error', error: 'Cannot change the type of the global workspace.' };
				}
			}

			const rowsUpdated = await this.db.table('workspace').where({ workspaceId }).update({
				workspaceName: workspaceName.trim(),
				workspaceType,
			});

			if (rowsUpdated === 0) {
				return { status: 'error', error: 'Workspace not found.' };
			}

			const dbResult = await this.db
				.table<Workspace>('workspace')
				.select('workspaceId', 'workspaceName', 'workspaceType', 'createdDate', 'createdBy')
				.where({ workspaceId })
				.first();

			if (!dbResult) {
				return { status: 'error', error: 'Workspace not found after update.' };
			}

			const workspace = this.marshalToType<Workspace>(dbResult);

			return { status: 'success', data: workspace };
		} catch (error: any) {
			console.error('Error updating workspace:', error.message);

			if (error.message?.includes('ER_DUP_ENTRY')) {
				return { status: 'error', error: 'A workspace with this name already exists.' };
			}

			return { status: 'error', error: 'Failed to update workspace.' };
		}
	}

	// delete a workspace and all associated data
	async deleteWorkspace(workspaceId: string): Promise<QueryResult<boolean>> {
		// prevent deletion of the global workspace
		if (workspaceId === 'ws-global-catalog') {
			return { status: 'error', error: 'The global workspace cannot be deleted.' };
		}

		try {
			await this.db.query.transaction(async (trx) => {
				// delete workspace user associations
				await trx('workspaceUser').where({ workspaceId }).del();

				// delete the workspace itself
				const rowsDeleted = await trx('workspace').where({ workspaceId }).del();

				if (rowsDeleted === 0) {
					throw new Error('Workspace not found.');
				}
			});

			return { status: 'success', data: true };
		} catch (error: any) {
			console.error('Error deleting workspace:', error.message);
			return { status: 'error', error: error.message || 'Failed to delete workspace.' };
		}
	}

	// get workspace members
	async getWorkspaceMembers(
		workspaceId: string
	): Promise<QueryResult<Array<WorkspaceUser & { username: string; email: string }>>> {
		try {
			const dbResult = await this.db
				.table('workspaceUser as wu')
				.join('user as u', 'wu.userId', 'u.userId')
				.where('wu.workspaceId', workspaceId)
				.select(
					'wu.workspaceId',
					'wu.userId',
					'wu.workspaceRole',
					'wu.joinedDate',
					'u.username',
					'u.email'
				)
				.orderBy('wu.workspaceRole', 'asc')
				.orderBy('u.username', 'asc');

			const members =
				marshalToType<Array<WorkspaceUser & { username: string; email: string }>>(dbResult);

			return { status: 'success', data: members };
		} catch (error: any) {
			console.error('Error getting workspace members:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// add a user to a workspace
	async addWorkspaceMember(
		workspaceId: string,
		userId: string,
		role: WorkspaceRole
	): Promise<QueryResult<WorkspaceUser>> {
		try {
			await this.db.table('workspaceUser').insert({
				workspaceId,
				userId,
				workspaceRole: role,
				joinedDate: Logger.now(),
			});

			const dbResult = await this.db
				.table<WorkspaceUser>('workspaceUser')
				.where({ workspaceId, userId })
				.first();

			if (!dbResult) {
				return { status: 'error', error: 'Failed to add member.' };
			}

			const member = this.marshalToType<WorkspaceUser>(dbResult);

			return { status: 'success', data: member };
		} catch (error: any) {
			console.error('Error adding workspace member:', error.message);

			if (error.message?.includes('ER_DUP_ENTRY')) {
				return { status: 'error', error: 'User is already a member of this workspace.' };
			}

			return { status: 'error', error: 'Failed to add member to workspace.' };
		}
	}

	// remove a user from a workspace
	async removeWorkspaceMember(workspaceId: string, userId: string): Promise<QueryResult<boolean>> {
		try {
			const rowsDeleted = await this.db.table('workspaceUser').where({ workspaceId, userId }).del();

			if (rowsDeleted === 0) {
				return { status: 'error', error: 'Member not found in workspace.' };
			}

			return { status: 'success', data: true };
		} catch (error: any) {
			console.error('Error removing workspace member:', error.message);
			return { status: 'error', error: 'Failed to remove member from workspace.' };
		}
	}

	// update a member's role in a workspace
	async updateWorkspaceMemberRole(
		workspaceId: string,
		userId: string,
		role: WorkspaceRole
	): Promise<QueryResult<WorkspaceUser>> {
		try {
			const rowsUpdated = await this.db
				.table('workspaceUser')
				.where({ workspaceId, userId })
				.update({ workspaceRole: role });

			if (rowsUpdated === 0) {
				return { status: 'error', error: 'Member not found in workspace.' };
			}

			const dbResult = await this.db
				.table<WorkspaceUser>('workspaceUser')
				.where({ workspaceId, userId })
				.first();

			if (!dbResult) {
				return { status: 'error', error: 'Failed to retrieve updated member.' };
			}

			const member = this.marshalToType<WorkspaceUser>(dbResult);

			return { status: 'success', data: member };
		} catch (error: any) {
			console.error('Error updating workspace member role:', error.message);
			return { status: 'error', error: 'Failed to update member role.' };
		}
	}
}
