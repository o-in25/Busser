// user management repository
import moment from 'moment';

import { generateSecureCode } from '$lib/math';
import type {
	Invitation,
	InvitationRequest,
	PasswordResetToken,
	Permission,
	QueryResult,
	RegistrationToken,
	Role,
	SelectOption,
	User,
} from '$lib/types';

import { DbProvider } from '../db';
import { generateRandomShapeAvatar } from '../generators/avatar-generator';
import { Logger } from '../logger';
import { MailClient } from '../mail';
import { deleteSignedUrl, uploadAvatarBuffer } from '../storage';
import { AuthRepository } from './auth.repository';
import { BaseRepository, marshal, marshalToType } from './base.repository';

export class UserRepository extends BaseRepository {
	private mailClient: MailClient;
	private authRepo: AuthRepository;

	constructor(db: DbProvider, authRepo: AuthRepository) {
		super(db);
		this.mailClient = new MailClient();
		this.authRepo = authRepo;
	}

	// user CRUD
	async findAll(): Promise<User[]> {
		try {
			let users = await this.db.table<User>('user');
			return users.map((user) => Object.assign({}, user));
		} catch (error: any) {
			console.error(error);
			return [];
		}
	}

	async findById(userId: string): Promise<QueryResult<User>> {
		try {
			const user: User = await this.db.query.transaction(async (trx) => {
				let dbResult: any = await trx('user')
					.select('userId', 'email', 'username', 'lastActivityDate', 'avatarImageUrl')
					.first()
					.where({ userId });

				let user = marshalToType<User>(dbResult);
				if (!user.userId) throw new Error('User not found.');

				// get role ids
				dbResult = await trx('userRole').select('roleId').where({ userId });
				let roleIds: any[] = marshal(dbResult);
				roleIds = roleIds.map(({ roleId }) => roleId);

				// get roles
				dbResult = await trx('role').select().whereIn('roleId', roleIds);
				const roles: Role[] = marshalToType<Role[]>(dbResult);

				// get permission ids
				dbResult = await trx('rolePermission').select('permissionId').whereIn('roleId', roleIds);
				let permissionIds: any[] = marshal(dbResult);
				permissionIds = permissionIds.map(({ permissionId }) => permissionId);

				// get permissions
				dbResult = await trx('permission').select().whereIn('permissionId', permissionIds);
				const permissions: Permission[] = marshalToType<Permission[]>(dbResult);

				return { ...user, roles, permissions };
			});

			return { status: 'success', data: user };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: error.message };
		}
	}

	async create(
		username: string,
		email: string,
		password: string,
		roleIds: string[]
	): Promise<User | null> {
		try {
			const hashedPassword = await this.authRepo.hashPassword(password);
			let userId: string | undefined;

			await this.db.query.transaction(async (trx) => {
				await trx('user').insert({ username, email, password: hashedPassword });

				let dbResult: any = await trx('user')
					.select('userId')
					.where({ username, email, password: hashedPassword })
					.first();

				const user: Partial<User> = marshalToType<Partial<User>>(dbResult);
				if (!user.userId) throw new Error('Could not create user.');

				userId = user.userId;
				const userRoles = roleIds.map((roleId) => ({ userId: user.userId || '', roleId }));
				await trx('userRole').insert(userRoles);
			});

			if (!userId) return null;
			const result = await this.findById(userId);
			return result.status === 'success' ? result.data || null : null;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async update(
		userId: string,
		username: string,
		email: string,
		roleIds: string[] = []
	): Promise<QueryResult<User>> {
		try {
			const user: User = await this.db.query.transaction(async (trx) => {
				await trx('user').where({ userId }).update({ username, email });

				if (roleIds.length) {
					await trx('userRole').where({ userId }).del();
					const userRoles = roleIds.map((roleId) => ({ userId, roleId }));
					await trx('userRole').insert(userRoles);
				}

				const queryResult = await this.findById(userId);
				if (queryResult.status !== 'success') throw new Error(queryResult.error);
				return queryResult.data as User;
			});

			return { status: 'success', data: user };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: error.message };
		}
	}

	async delete(
		userId: string,
		currentUserId: string
	): Promise<{ error?: string; refresh: User[] }> {
		let response: { error?: string; refresh: User[] } = { refresh: [] };
		try {
			if (userId === currentUserId) {
				throw new Error('Invalid user ID to delete.');
			}
			const result = await this.db.table('user').where({ userId }).del();
			if (result !== 1) {
				response.error = 'Returned unexpected number of rows.';
			}
		} catch (error: any) {
			console.error(error);
			response.error = error.message || 'An error occurred.';
		} finally {
			response.refresh = await this.findAll();
		}
		return response;
	}

	// role management
	async getRoleOptions(): Promise<SelectOption[]> {
		try {
			let result = await this.db.table('role').select();
			let roles: Role[] = marshalToType<Role[]>(result);
			return roles.map(({ roleId, roleName }) => ({ name: roleName, value: roleId }));
		} catch (error: any) {
			console.error(error);
			return [];
		}
	}

	async getGrants(roleId: string = ''): Promise<QueryResult<Array<Role & Permission>>> {
		try {
			let query = this.db
				.table('rolePermission as rp')
				.join('permission as p', 'rp.permissionId', 'p.permissionId')
				.join('role as r', 'rp.roleId', 'r.roleId');

			if (roleId) {
				query = query.where('r.roleId', roleId);
			}

			const dbResult = await query.select(
				'r.roleName',
				'p.permissionName',
				'rp.roleId',
				'rp.permissionId'
			);

			const grants: Array<Role & Permission> = marshalToType<Array<Role & Permission>>(dbResult);

			return { status: 'success', data: grants };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: error.message };
		}
	}

	async updateGrants(
		roleId: string,
		permissions: Permission[]
	): Promise<QueryResult<Array<Role & Permission>>> {
		try {
			await this.db.query.transaction(async (trx) => {
				let newPermissions: Permission[] = permissions.filter(({ permissionId }) => !permissionId);
				let oldPermissions: Permission[] = permissions.filter(({ permissionId }) => permissionId);

				if (newPermissions.length) {
					await trx('permission')
						.insert(newPermissions.map(({ permissionName }) => ({ permissionName })))
						.onConflict('permissionName')
						.ignore();

					let dbResult: any = await trx('permission')
						.select('permissionId', 'permissionName')
						.whereIn(
							'permissionName',
							newPermissions.map(({ permissionName }) => permissionName)
						);

					newPermissions = marshalToType<Permission[]>(dbResult);
				}

				oldPermissions = [...oldPermissions, ...newPermissions];
				const rolePermissions = oldPermissions.map(({ permissionId }) => ({
					roleId,
					permissionId,
				}));

				await trx('rolePermission').where({ roleId }).del();
				if (rolePermissions.length) {
					await trx('rolePermission').insert(rolePermissions);
				}
			});

			return { status: 'success', data: [] };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: error.message };
		}
	}

	// invitation management
	async getInvitations(): Promise<QueryResult<Invitation[]>> {
		try {
			let dbResult = await this.db.table('invitation').select();
			const invitations: Invitation[] = marshalToType<Invitation[]>(dbResult);
			return { status: 'success', data: invitations };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error };
		}
	}

	async createInvitation(
		email: string | null = null,
		expiresAt: string | null = null,
		invitationCode: string | null = null
	): Promise<QueryResult<Invitation>> {
		try {
			const code = invitationCode?.trim() || generateSecureCode();

			const [invitationId] = await this.db.table('invitation').insert({
				invitationCode: code,
				email: email?.trim() || null,
				createdAt: Logger.now(),
				issuedAt: Logger.now(),
				expiresAt: expiresAt || null,
				userId: null,
				lastSentAt: null,
			});

			const dbResult = await this.db.table('invitation').where({ invitationId }).first();
			const invitation = marshalToType<Invitation>(dbResult);

			return { status: 'success', data: invitation };
		} catch (error: any) {
			console.error('Failed to create invitation:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async deleteInvitation(invitationId: number): Promise<QueryResult<number>> {
		try {
			const rowsDeleted = await this.db.table('invitation').where({ invitationId }).del();
			if (rowsDeleted === 0) throw new Error('Invitation not found.');
			return { status: 'success', data: rowsDeleted };
		} catch (error: any) {
			console.error('Failed to delete invitation:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// invitation request management
	async createInvitationRequest(email: string, message?: string | null): Promise<QueryResult> {
		try {
			const normalizedEmail = email.trim().toLowerCase();

			const existingRequest = await this.db
				.table('invitationRequest')
				.where({ email: normalizedEmail, status: 'pending' })
				.first();

			if (existingRequest) {
				return {
					status: 'error',
					error:
						'You have already requested an invitation. Please wait for an admin to review your request.',
				};
			}

			const existingInvitation = await this.db
				.table('invitation')
				.where({ email: normalizedEmail })
				.whereNull('userId')
				.first();

			if (existingInvitation) {
				return {
					status: 'error',
					error: 'An invitation has already been created for this email. Please check your inbox.',
				};
			}

			const existingUser = await this.db.table('user').where({ email: normalizedEmail }).first();

			if (existingUser) {
				return {
					status: 'error',
					error: 'This email is already registered. Please try logging in instead.',
				};
			}

			await this.db.table('invitationRequest').insert({
				email: normalizedEmail,
				message: message?.trim() || null,
				status: 'pending',
				createdAt: Logger.now(),
				resolvedAt: null,
				resolvedBy: null,
			});

			return { status: 'success' };
		} catch (error: any) {
			console.error('Failed to create invitation request:', error.message);
			return { status: 'error', error: 'Failed to submit your request. Please try again.' };
		}
	}

	async getInvitationRequests(
		status?: 'pending' | 'fulfilled' | 'rejected'
	): Promise<QueryResult<InvitationRequest[]>> {
		try {
			let query = this.db.table('invitationRequest').orderBy('createdAt', 'desc');
			if (status) query = query.where({ status });

			const dbResult = await query.select();
			const requests = marshalToType<InvitationRequest[]>(dbResult);

			return { status: 'success', data: requests };
		} catch (error: any) {
			console.error('Failed to get invitation requests:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async getPendingInvitationRequestCount(): Promise<number> {
		try {
			const result = (await this.db
				.table('invitationRequest')
				.where({ status: 'pending' })
				.count('invitationRequestId as count')
				.first()) as { count: number } | undefined;

			return Number(result?.count || 0);
		} catch (error: any) {
			console.error('Failed to get pending request count:', error.message);
			return 0;
		}
	}

	async fulfillInvitationRequest(
		invitationRequestId: number,
		resolvedBy: string
	): Promise<QueryResult> {
		try {
			const result = await this.db
				.table('invitationRequest')
				.where({ invitationRequestId })
				.update({ status: 'fulfilled', resolvedAt: Logger.now(), resolvedBy });

			if (result === 0) throw new Error('Invitation request not found.');
			return { status: 'success' };
		} catch (error: any) {
			console.error('Failed to fulfill invitation request:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async rejectInvitationRequest(
		invitationRequestId: number,
		resolvedBy: string
	): Promise<QueryResult> {
		try {
			const result = await this.db
				.table('invitationRequest')
				.where({ invitationRequestId })
				.update({ status: 'rejected', resolvedAt: Logger.now(), resolvedBy });

			if (result === 0) throw new Error('Invitation request not found.');
			return { status: 'success' };
		} catch (error: any) {
			console.error('Failed to reject invitation request:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// registration flow
	async register(
		username: string,
		email: string,
		password: string,
		invitationCode: string
	): Promise<QueryResult> {
		try {
			const { user } = await this.db.query.transaction(async (trx) => {
				let user: Pick<User, 'userId' | 'username' | 'email'>;
				let invitation: Pick<Invitation, 'invitationId' | 'userId' | 'email' | 'expiresAt'>;

				// validate invitation
				let dbResult: any = await trx('invitation')
					.select('invitationId', 'userId', 'email', 'expiresAt')
					.where({ invitationCode })
					.first();

				if (!dbResult) throw new Error('Invalid invitation code.');

				invitation =
					marshalToType<Pick<Invitation, 'invitationId' | 'userId' | 'email' | 'expiresAt'>>(
						dbResult
					);

				if (!invitation.invitationId || invitation.userId !== null) {
					throw new Error('Invitation code has already been used.');
				}

				if (invitation.expiresAt && moment().isAfter(moment(invitation.expiresAt))) {
					throw new Error('Invitation code has expired.');
				}

				if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) {
					throw new Error('Email does not match the invitation.');
				}

				// check username/email
				dbResult = await trx('user').select('username').where({ username }).first();
				if (dbResult) throw new Error('Username already taken.');

				dbResult = await trx('user').select('email').where({ email }).first();
				if (dbResult) throw new Error('Email already taken.');

				// create user
				const hashedPassword = await this.authRepo.hashPassword(password);
				await trx('user').insert({ username, email, password: hashedPassword, verified: 0 });

				dbResult = await trx('user')
					.select('userId', 'username', 'email')
					.where({ username, email, password: hashedPassword })
					.first();

				user = marshalToType<Pick<User, 'userId' | 'username' | 'email'>>(dbResult);

				if (!user.userId || !user.username || !user.email) {
					throw new Error('Could not create user.');
				}

				// assign default role
				dbResult = await trx('role').select('roleId').where('roleName', 'USER').first();
				dbResult = marshal(dbResult);

				if (!dbResult?.roleId) throw new Error('Could not register user for default role.');

				await trx('userRole').insert({ userId: user.userId, roleId: dbResult.roleId });

				// mark invitation as used
				await trx('invitation')
					.update({ userId: user.userId })
					.where({ invitationId: invitation.invitationId });

				// create default personal workspace for user
				const slug = user.username
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '')
					.substring(0, 40);
				const suffix = Math.random().toString(36).substring(2, 10);
				const workspaceId = `${slug}-${suffix}`;
				const workspaceName = `${user.username}'s Workspace`;

				await trx('workspace').insert({
					workspaceId,
					workspaceName,
					workspaceType: 'personal',
					createdDate: Logger.now(),
					createdBy: user.userId,
				});

				await trx('workspaceUser').insert({
					workspaceId,
					userId: user.userId,
					workspaceRole: 'owner',
					joinedDate: Logger.now(),
				});

				return { user };
			});

			// generate avatar for new user (non-blocking)
			this.generateAndUploadAvatar(user.userId).catch((err) => {
				console.error('Failed to generate avatar for new user:', err);
			});

			// send verification email
			const now = moment();
			const tokenExpiration = moment().add(24, 'hours');

			const token = await this.authRepo.signToken<RegistrationToken>({
				userId: user.userId,
				iat: now.unix(),
				exp: tokenExpiration.unix(),
			});

			await this.mailClient.sendUserRegistrationEmail([user.email], {
				username: user.username,
				token,
			});

			return { status: 'success' };
		} catch (error: any) {
			console.error(error);

			const getFriendlyError = (message: string): string => {
				if (message.includes('ER_DUP_ENTRY') && message.includes('email')) {
					return 'This email address is already registered.';
				}
				if (message.includes('ER_DUP_ENTRY') && message.includes('username')) {
					return 'This username is already taken.';
				}
				if (message.includes('ER_DUP_ENTRY')) {
					return 'An account with these details already exists.';
				}

				const friendlyMessages = [
					'Invalid invitation code.',
					'Invitation code has already been used.',
					'Invitation code has expired.',
					'Email does not match the invitation.',
					'Username already taken.',
					'Email already taken.',
					'Could not create user.',
					'Could not register user for default role.',
				];

				if (friendlyMessages.includes(message)) return message;
				return 'An error occurred during registration. Please try again.';
			};

			return { status: 'error', error: getFriendlyError(error.message) };
		}
	}

	async verify(registrationToken: string): Promise<QueryResult> {
		try {
			const { valid, expired, payload } =
				await this.authRepo.verifyRegistrationToken(registrationToken);

			if (!valid || !payload?.userId) throw new Error('Token is invalid.');
			if (expired) throw new Error('Token is expired.');

			await this.db.table('user').update('verified', 1).where({ userId: payload.userId });

			return { status: 'success' };
		} catch (error: any) {
			return { status: 'error', error: error.message };
		}
	}

	async resendVerificationEmail(userId: string): Promise<QueryResult> {
		try {
			const dbResult = await this.db
				.table('user')
				.select('userId', 'username', 'email', 'verified')
				.where({ userId })
				.first();

			if (!dbResult) throw new Error('User not found.');

			const user =
				marshalToType<Pick<User, 'userId' | 'username' | 'email' | 'verified'>>(dbResult);

			if (user.verified === 1) throw new Error('User is already verified.');

			const now = moment();
			const tokenExpiration = moment().add(24, 'hours');

			const token = await this.authRepo.signToken<RegistrationToken>({
				userId: user.userId,
				iat: now.unix(),
				exp: tokenExpiration.unix(),
			});

			await this.mailClient.sendUserRegistrationEmail([user.email], {
				username: user.username,
				token,
			});

			return { status: 'success' };
		} catch (error: any) {
			return { status: 'error', error: error.message };
		}
	}

	async resendVerificationEmailByEmail(email: string): Promise<QueryResult> {
		try {
			const dbResult = await this.db
				.table('user')
				.select('userId', 'username', 'email', 'verified')
				.where({ email })
				.first();

			if (!dbResult) throw new Error('No account found with this email address.');

			const user =
				marshalToType<Pick<User, 'userId' | 'username' | 'email' | 'verified'>>(dbResult);

			if (user.verified === 1) throw new Error('This account is already verified. You can log in.');

			const now = moment();
			const tokenExpiration = moment().add(24, 'hours');

			const token = await this.authRepo.signToken<RegistrationToken>({
				userId: user.userId,
				iat: now.unix(),
				exp: tokenExpiration.unix(),
			});

			await this.mailClient.sendUserRegistrationEmail([user.email], {
				username: user.username,
				token,
			});

			return { status: 'success' };
		} catch (error: any) {
			return { status: 'error', error: error.message };
		}
	}

	// Preferred workspace management
	async getPreferredWorkspaceId(userId: string): Promise<string | null> {
		try {
			const dbResult = await this.db
				.table('user')
				.select('preferredWorkspaceId')
				.where({ userId })
				.first();

			if (!dbResult) return null;

			const result = marshalToType<{ preferredWorkspaceId: string | null }>(dbResult);
			return result.preferredWorkspaceId;
		} catch (error: any) {
			console.error('Error getting preferred workspace:', error.message);
			return null;
		}
	}

	async setPreferredWorkspaceId(userId: string, workspaceId: string | null): Promise<QueryResult> {
		try {
			const rowsUpdated = await this.db
				.table('user')
				.where({ userId })
				.update({ preferredWorkspaceId: workspaceId });

			if (rowsUpdated === 0) {
				return { status: 'error', error: 'User not found.' };
			}

			return { status: 'success' };
		} catch (error: any) {
			console.error('Error setting preferred workspace:', error.message);
			return { status: 'error', error: 'Failed to set preferred workspace.' };
		}
	}

	async updateAvatarUrl(userId: string, avatarImageUrl: string | null): Promise<QueryResult> {
		try {
			const rowsUpdated = await this.db.table('user').where({ userId }).update({ avatarImageUrl });

			if (rowsUpdated === 0) {
				return { status: 'error', error: 'User not found.' };
			}

			return { status: 'success' };
		} catch (error: any) {
			console.error('Error updating avatar URL:', error.message);
			return { status: 'error', error: 'Failed to update avatar.' };
		}
	}

	async generateAndUploadAvatar(userId: string): Promise<QueryResult<string>> {
		try {
			// get current avatar to delete if exists
			const dbResult = await this.db
				.table('user')
				.select('avatarImageUrl')
				.where({ userId })
				.first();

			const currentUrl = dbResult?.avatarImageUrl || dbResult?.avatarImageUrl;
			if (currentUrl) {
				await deleteSignedUrl(currentUrl);
			}

			// generate new avatar
			const avatar = generateRandomShapeAvatar(`${userId}-${Date.now()}`);
			const publicUrl = await uploadAvatarBuffer(avatar.buffer, userId, 'image/svg+xml');

			if (!publicUrl) {
				return { status: 'error', error: 'Failed to upload avatar.' };
			}

			// update user record
			await this.db.table('user').where({ userId }).update({ avatarImageUrl: publicUrl });

			return { status: 'success', data: publicUrl };
		} catch (error: any) {
			console.error('Error generating avatar:', error.message);
			return { status: 'error', error: 'Failed to generate avatar.' };
		}
	}

	async uploadCustomAvatar(userId: string, file: File): Promise<QueryResult<string>> {
		try {
			// get current avatar to delete if exists
			const dbResult = await this.db
				.table('user')
				.select('avatarImageUrl')
				.where({ userId })
				.first();

			const currentUrl = dbResult?.avatarImageUrl || dbResult?.avatarImageUrl;
			if (currentUrl) {
				await deleteSignedUrl(currentUrl);
			}

			// upload new avatar
			const buffer = Buffer.from(await file.arrayBuffer());
			const publicUrl = await uploadAvatarBuffer(buffer, userId, file.type);

			if (!publicUrl) {
				return { status: 'error', error: 'Failed to upload avatar.' };
			}

			// update user record
			await this.db.table('user').where({ userId }).update({ avatarImageUrl: publicUrl });

			return { status: 'success', data: publicUrl };
		} catch (error: any) {
			console.error('Error uploading avatar:', error.message);
			return { status: 'error', error: 'Failed to upload avatar.' };
		}
	}

	// get users in workspaces where the given user is an owner
	async getUsersInOwnedWorkspaces(userId: string): Promise<User[]> {
		try {
			// get workspace ids where user is owner
			const ownedWorkspaces = await this.db
				.table('workspaceUser')
				.select('workspaceId')
				.where({ userId, workspaceRole: 'owner' });

			const workspaceIds = ownedWorkspaces.map((w: any) => w.workspaceId || w.workspace_id);

			if (workspaceIds.length === 0) return [];

			// get distinct user ids in those workspaces
			const userIdsResult = await this.db
				.table('workspaceUser')
				.distinct('userId')
				.whereIn('workspaceId', workspaceIds);

			const userIds = userIdsResult.map((u: any) => u.userId || u.user_id);

			if (userIds.length === 0) return [];

			// fetch all users with their roles and permissions
			const users: User[] = [];
			for (const uid of userIds) {
				const result = await this.findById(uid);
				if (result.status === 'success' && result.data) {
					users.push(result.data);
				}
			}

			return users;
		} catch (error: any) {
			console.error('Error getting users in owned workspaces:', error.message);
			return [];
		}
	}

	// get users that can be invited to workspaces by the given user
	async getInvitableUsers(userId: string, hasEditAdmin: boolean): Promise<User[]> {
		try {
			// admins can invite anyone
			if (hasEditAdmin) {
				return this.findAll();
			}

			// regular users can only invite users they share a workspace with
			const userWorkspaces = await this.db
				.table('workspaceUser')
				.select('workspaceId')
				.where({ userId });

			const workspaceIds = userWorkspaces.map((w: any) => w.workspaceId || w.workspace_id);

			if (workspaceIds.length === 0) return [];

			// get distinct user ids in those workspaces (excluding self)
			const userIdsResult = await this.db
				.table('workspaceUser')
				.distinct('userId')
				.whereIn('workspaceId', workspaceIds)
				.whereNot('userId', userId);

			const userIds = userIdsResult.map((u: any) => u.userId || u.user_id);

			if (userIds.length === 0) return [];

			const users: User[] = [];
			for (const uid of userIds) {
				const result = await this.findById(uid);
				if (result.status === 'success' && result.data) {
					users.push(result.data);
				}
			}

			return users;
		} catch (error: any) {
			console.error('Error getting invitable users:', error.message);
			return [];
		}
	}

	async requestPasswordReset(email: string): Promise<QueryResult> {
		try {
			const dbResult = await this.db
				.table('user')
				.select('userId', 'username', 'email', 'verified')
				.where({ email })
				.first();

			if (!dbResult) {
				// don't reveal if email exists
				return { status: 'success' };
			}

			const user =
				marshalToType<Pick<User, 'userId' | 'username' | 'email' | 'verified'>>(dbResult);

			const now = moment();
			const tokenExpiration = moment().add(1, 'hour');

			const token = await this.authRepo.signToken<PasswordResetToken>({
				userId: user.userId,
				email: user.email,
				type: 'password-reset',
				iat: now.unix(),
				exp: tokenExpiration.unix(),
			});

			await this.mailClient.sendPasswordResetEmail([user.email], {
				username: user.username,
				token,
			});

			return { status: 'success' };
		} catch (error: any) {
			console.error('Password reset request error:', error);
			return {
				status: 'error',
				error: 'Failed to process password reset request. Please try again.',
			};
		}
	}
}
