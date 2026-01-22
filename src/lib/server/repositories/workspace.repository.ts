// workspace management repository
import type {
  QueryResult,
  Workspace,
  WorkspaceUser,
} from '$lib/types';
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
        .query('user_t.workspace as w')
        .join('user_t.workspaceUser as wu', 'w.workspaceId', 'wu.workspaceId')
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
}
