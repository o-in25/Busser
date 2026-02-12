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
	UserFavorite,
} from '$lib/types';

import { DbProvider } from '../db';
import { generateRandomShapeAvatar } from '../generators/avatar-generator';
import { Logger } from '../logger';
import { MailClient } from '../mail';
import { deleteSignedUrl, uploadAvatarBuffer } from '../storage';
import { AuthRepository } from './auth.repository';
import { BaseRepository } from './base.repository';

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
					.select('UserId', 'Email', 'Username', 'LastActivityDate', 'AvatarImageUrl')
					.first()
					.where({ userId });

				let user = dbResult as User;
				if (!user.userId) throw new Error('User not found.');

				// get role ids
				dbResult = await trx('userRole').select('roleId').where({ userId });
				let roleIds: any[] = dbResult;
				roleIds = roleIds.map(({ roleId }) => roleId);

				// get roles
				dbResult = await trx('role').select().whereIn('roleId', roleIds);
				const roles = dbResult as Role[];

				// get permission ids
				dbResult = await trx('rolePermission').select('permissionId').whereIn('roleId', roleIds);
				let permissionIds: any[] = dbResult;
				permissionIds = permissionIds.map(({ permissionId }) => permissionId);

				// get permissions
				dbResult = await trx('permission').select().whereIn('permissionId', permissionIds);
				const permissions = dbResult as Permission[];

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

				const user = dbResult as Partial<User>;
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
			let roles = result as Role[];
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

			const grants = dbResult as Array<Role & Permission>;

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

					newPermissions = dbResult as Permission[];
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
			const invitations = dbResult as Invitation[];
			return { status: 'success', data: invitations };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error };
		}
	}

	async createInvitation(
		email: string | null = null,
		expiresAt: string | null = null,
		invitationCode: string | null = null,
		workspaceId: string | null = null,
		workspaceRole: 'owner' | 'editor' | 'viewer' | null = null
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
				workspaceId: workspaceId || null,
				workspaceRole: workspaceRole || null,
			});

			const dbResult = await this.db.table('invitation').where({ invitationId }).first();
			const invitation = dbResult as Invitation;

			return { status: 'success', data: invitation };
		} catch (error: any) {
			console.error('Failed to create invitation:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async getWorkspaceInvitations(workspaceId: string): Promise<QueryResult<Invitation[]>> {
		try {
			const dbResult = await this.db
				.table('invitation')
				.where({ workspaceId })
				.whereNull('userId')
				.select();
			const invitations = dbResult as Invitation[];
			return { status: 'success', data: invitations };
		} catch (error: any) {
			console.error('Failed to get workspace invitations:', error.message);
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

	async getInvitationByCode(invitationCode: string): Promise<QueryResult<Invitation>> {
		try {
			const dbResult = await this.db.table('invitation').where({ invitationCode }).first();
			if (!dbResult) {
				return { status: 'error', error: 'Invitation not found.' };
			}
			const invitation = dbResult as Invitation;
			return { status: 'success', data: invitation };
		} catch (error: any) {
			console.error('Failed to get invitation:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async acceptWorkspaceInvitation(
		invitationCode: string,
		userId: string
	): Promise<QueryResult<{ workspaceId: string; workspaceRole: string }>> {
		try {
			return await this.db.query.transaction(async (trx) => {
				// get invitation
				const dbResult = await trx('invitation').where({ invitationCode }).first();
				if (!dbResult) throw new Error('Invitation not found.');

				const invitation = dbResult as Invitation;

				if (invitation.userId !== null) {
					throw new Error('Invitation has already been used.');
				}

				if (invitation.expiresAt && moment().isAfter(moment(invitation.expiresAt))) {
					throw new Error('Invitation has expired.');
				}

				if (!invitation.workspaceId || !invitation.workspaceRole) {
					throw new Error('This is not a workspace invitation.');
				}

				// check if user is already a member
				const existingMember = await trx('workspaceUser')
					.where({ workspaceId: invitation.workspaceId, userId })
					.first();

				if (existingMember) {
					throw new Error('You are already a member of this workspace.');
				}

				// add user to workspace
				await trx('workspaceUser').insert({
					workspaceId: invitation.workspaceId,
					userId,
					workspaceRole: invitation.workspaceRole,
					joinedDate: Logger.now(),
				});

				// mark invitation as used
				await trx('invitation').where({ invitationId: invitation.invitationId }).update({ userId });

				return {
					status: 'success' as const,
					data: {
						workspaceId: invitation.workspaceId,
						workspaceRole: invitation.workspaceRole,
					},
				};
			});
		} catch (error: any) {
			console.error('Failed to accept invitation:', error.message);
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
			const requests = dbResult as InvitationRequest[];

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
		invitationCode: string | null
	): Promise<QueryResult> {
		try {
			const { user } = await this.db.query.transaction(async (trx) => {
				let user: Pick<User, 'userId' | 'username' | 'email'>;
				let invitation: Pick<
					Invitation,
					'invitationId' | 'userId' | 'email' | 'expiresAt' | 'workspaceId' | 'workspaceRole'
				> | null = null;

				// validate invitation (only when code is provided)
				if (invitationCode) {
					let dbResult: any = await trx('invitation')
						.select('invitationId', 'userId', 'email', 'expiresAt', 'workspaceId', 'workspaceRole')
						.where({ invitationCode })
						.first();

					if (!dbResult) throw new Error('Invalid invitation code.');

					invitation = dbResult as Pick<
						Invitation,
						'invitationId' | 'userId' | 'email' | 'expiresAt' | 'workspaceId' | 'workspaceRole'
					>;

					if (!invitation.invitationId || invitation.userId !== null) {
						throw new Error('Invitation code has already been used.');
					}

					if (invitation.expiresAt && moment().isAfter(moment(invitation.expiresAt))) {
						throw new Error('Invitation code has expired.');
					}

					if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) {
						throw new Error('Email does not match the invitation.');
					}
				}

				// check username/email
				let dbResult: any = await trx('user').select('username').where({ username }).first();
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

				user = dbResult as Pick<User, 'userId' | 'username' | 'email'>;

				if (!user.userId || !user.username || !user.email) {
					throw new Error('Could not create user.');
				}

				// assign default role
				dbResult = await trx('role').select('roleId').where('roleName', 'USER').first();

				if (!dbResult?.roleId) throw new Error('Could not register user for default role.');

				await trx('userRole').insert({ userId: user.userId, roleId: dbResult.roleId });

				// mark invitation as used
				if (invitation) {
					await trx('invitation')
						.update({ userId: user.userId })
						.where({ invitationId: invitation.invitationId });
				}

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

				// if invitation was for a specific workspace, add user to that workspace too
				if (invitation?.workspaceId && invitation?.workspaceRole) {
					await trx('workspaceUser').insert({
						workspaceId: invitation.workspaceId,
						userId: user.userId,
						workspaceRole: invitation.workspaceRole,
						joinedDate: Logger.now(),
					});
				}

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

			const user = dbResult as Pick<User, 'userId' | 'username' | 'email' | 'verified'>;

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

			const user = dbResult as Pick<User, 'userId' | 'username' | 'email' | 'verified'>;

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

			const result = dbResult as { preferredWorkspaceId: string | null };
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
			const result = await this.db
				.table('user')
				.where({ userId })
				.update({ AvatarImageUrl: avatarImageUrl });

			// knex mysql returns number of matched rows
			const rowsUpdated = Array.isArray(result) ? result[0] : result;

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
				.select('AvatarImageUrl')
				.where({ userId })
				.first();

			const currentUrl = dbResult?.avatarImageUrl;
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
			await this.db.table('user').where({ userId }).update({ AvatarImageUrl: publicUrl });

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
				.select('AvatarImageUrl')
				.where({ userId })
				.first();

			const currentUrl = dbResult?.avatarImageUrl;
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
			await this.db.table('user').where({ userId }).update({ AvatarImageUrl: publicUrl });

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

			const workspaceIds = ownedWorkspaces.map((w: any) => w.workspaceId);

			if (workspaceIds.length === 0) return [];

			// get distinct user ids in those workspaces
			const userIdsResult = await this.db
				.table('workspaceUser')
				.distinct('userId')
				.whereIn('workspaceId', workspaceIds);

			const userIds = userIdsResult.map((u: any) => u.userId);

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

			const workspaceIds = userWorkspaces.map((w: any) => w.workspaceId);

			if (workspaceIds.length === 0) return [];

			// get distinct user ids in those workspaces (excluding self)
			const userIdsResult = await this.db
				.table('workspaceUser')
				.distinct('userId')
				.whereIn('workspaceId', workspaceIds)
				.whereNot('userId', userId);

			const userIds = userIdsResult.map((u: any) => u.userId);

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

			const user = dbResult as Pick<User, 'userId' | 'username' | 'email' | 'verified'>;

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

	// User favorites management
	async getFavorites(userId: string, workspaceId?: string): Promise<UserFavorite[]> {
		try {
			let query = this.db.table('userFavorite').where({ userId });
			if (workspaceId) {
				query = query.where({ workspaceId });
			}
			const dbResult = await query.orderBy('createdDate', 'desc');
			return dbResult as UserFavorite[];
		} catch (error: any) {
			console.error('Error getting favorites:', error.message);
			return [];
		}
	}

	async addFavorite(userId: string, recipeId: number, workspaceId: string): Promise<QueryResult> {
		try {
			const favoriteId = crypto.randomUUID();
			await this.db.table('userFavorite').insert({
				favoriteId,
				userId,
				recipeId,
				workspaceId,
				createdDate: Logger.now(),
			});
			return { status: 'success' };
		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return { status: 'error', error: 'Recipe is already in favorites.' };
			}
			console.error('Error adding favorite:', error.message);
			return { status: 'error', error: 'Failed to add favorite.' };
		}
	}

	async removeFavorite(userId: string, recipeId: number): Promise<QueryResult> {
		try {
			const rowsDeleted = await this.db.table('userFavorite').where({ userId, recipeId }).del();
			if (rowsDeleted === 0) {
				return { status: 'error', error: 'Favorite not found.' };
			}
			return { status: 'success' };
		} catch (error: any) {
			console.error('Error removing favorite:', error.message);
			return { status: 'error', error: 'Failed to remove favorite.' };
		}
	}

	async isFavorite(userId: string, recipeId: number): Promise<boolean> {
		try {
			const dbResult = await this.db.table('userFavorite').where({ userId, recipeId }).first();
			return !!dbResult;
		} catch (error: any) {
			console.error('Error checking favorite:', error.message);
			return false;
		}
	}

	async toggleFavorite(
		userId: string,
		recipeId: number,
		workspaceId: string
	): Promise<QueryResult<{ isFavorite: boolean }>> {
		try {
			const exists = await this.isFavorite(userId, recipeId);
			if (exists) {
				const result = await this.removeFavorite(userId, recipeId);
				if (result.status === 'error') return result;
				return { status: 'success', data: { isFavorite: false } };
			} else {
				const result = await this.addFavorite(userId, recipeId, workspaceId);
				if (result.status === 'error') return result;
				return { status: 'success', data: { isFavorite: true } };
			}
		} catch (error: any) {
			console.error('Error toggling favorite:', error.message);
			return { status: 'error', error: 'Failed to toggle favorite.' };
		}
	}
}
