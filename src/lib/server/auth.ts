// auth service
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import moment from 'moment';

import type {
	PasswordResetToken,
	QueryResult,
	RegistrationToken,
	TokenResult,
	User,
} from '$lib/types';

import { DbProvider } from './db';
import { Logger } from './logger';
import { MailClient } from './mail';
import { SettingsRepository } from './repositories/settings.repository';
import { UserRepository } from './repositories/user.repository';
import { OAuthRepository } from './repositories/oauth.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';

const { JWT_SIGNING_KEY, USER_TABLE } = process.env;
const HASH_ROUNDS = 10;

// singletons
const db = new DbProvider(USER_TABLE || '');
const userRepo = new UserRepository(db);
const workspaceRepo = new WorkspaceRepository(db);
const settingsRepo = new SettingsRepository(db);
const oauthRepo = new OAuthRepository(db, userRepo);
const mailClient = new MailClient();

export { db, userRepo, workspaceRepo, settingsRepo, oauthRepo };

export async function verifyToken<T>(token: string): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
		jwt.verify(token, JWT_SIGNING_KEY, (err, decoded) => {
			if (err) return reject(err);
			return resolve(decoded as T);
		});
	});
}

export async function signToken<T>(payload: T): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
		jwt.sign(
			JSON.parse(JSON.stringify(payload)),
			JWT_SIGNING_KEY,
			{ algorithm: 'HS256' },
			(err, token) => {
				if (err) return reject(err);
				return resolve(token as string);
			}
		);
	});
}

export async function hashPassword(password: string): Promise<string> {
	return hash(password, HASH_ROUNDS);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
	return compare(password, hashedPassword);
}

export async function authenticate(userToken: string | undefined): Promise<User | null> {
	try {
		if (!userToken) return null;
		return await verifyToken<User>(userToken);
	} catch (error: any) {
		console.error(error);
		return null;
	}
}

export async function verifyRegistrationToken(token: string): Promise<TokenResult<RegistrationToken>> {
	try {
		const payload = await verifyToken<RegistrationToken>(token);
		return { valid: true, expired: false, payload };
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			const decoded = jwt.decode(token);
			return { valid: false, expired: true, payload: decoded as RegistrationToken | undefined };
		}
		return { valid: false, expired: false };
	}
}

export async function verifyPasswordResetToken(token: string): Promise<TokenResult<PasswordResetToken>> {
	try {
		const payload = await verifyToken<PasswordResetToken>(token);
		if (payload.type !== 'password-reset') {
			return { valid: false, expired: false };
		}
		return { valid: true, expired: false, payload };
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			const decoded = jwt.decode(token);
			return { valid: false, expired: true, payload: decoded as PasswordResetToken | undefined };
		}
		return { valid: false, expired: false };
	}
}

export async function login(
	username: string,
	password: string
): Promise<QueryResult<string | null> & { needsVerification?: boolean; email?: string }> {
	try {
		const userRecord = await userRepo.findCredentials(username);

		if (!userRecord) {
			throw new Error('User not found');
		}

		const { userId, email, verified, password: hashedPassword } = userRecord;
		if (!userId || !hashedPassword) {
			throw new Error('User not found');
		}

		const isValid = await comparePassword(password, hashedPassword);
		if (!isValid) {
			throw new Error('Incorrect password');
		}

		if (verified !== 1) {
			return {
				status: 'error',
				error:
					"Your email address hasn't been verified yet. Please check your inbox for the verification email.",
				needsVerification: true,
				email,
			};
		}

		const queryResult = await userRepo.findById(userId);
		if (queryResult.status === 'error') {
			throw new Error(queryResult.error);
		}

		await userRepo.updateLastActivity(userId);
		const user = queryResult.data || ({} as User);
		const userToken = await signToken<User>(user);

		return { status: 'success', data: userToken };
	} catch (error: any) {
		await Logger.error(error.message);
		if (username) {
			await Logger.info(`User ${username} attempted to sign in.`);
		}

		const getFriendlyError = ({ message }: { message: string }): string => {
			const messages: Record<string, string> = {
				'User not found': 'Invalid username or password.',
				'Incorrect password': 'Invalid username or password.',
			};

			if (messages[message]) return messages[message];
			if (message.includes('Cannot destructure') || message.includes('undefined')) {
				return 'Invalid username or password.';
			}
			return 'An error occurred while logging in. Please try again.';
		};

		return { status: 'error', error: getFriendlyError(error) };
	}
}

export async function registerUser(
	username: string,
	email: string,
	password: string,
	invitationCode: string | null
): Promise<QueryResult> {
	try {
		const hashedPassword = await hashPassword(password);

		const user = await userRepo.registerWithInvitation(
			{ username, email, password: hashedPassword, verified: 0, needsOnboarding: 0 },
			invitationCode
		);

		const now = moment();
		const tokenExpiration = moment().add(24, 'hours');

		const token = await signToken<RegistrationToken>({
			userId: user.userId,
			iat: now.unix(),
			exp: tokenExpiration.unix(),
		});

		await mailClient.sendUserRegistrationEmail([user.email], {
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

export async function verifyUser(registrationToken: string): Promise<QueryResult> {
	try {
		const { valid, expired, payload } = await verifyRegistrationToken(registrationToken);

		if (!valid || !payload?.userId) throw new Error('Token is invalid.');
		if (expired) throw new Error('Token is expired.');

		return userRepo.setVerified(payload.userId);
	} catch (error: any) {
		return { status: 'error', error: error.message };
	}
}

export async function resendVerificationEmail(userId: string): Promise<QueryResult> {
	try {
		const dbResult = await userRepo.findVerificationInfo(userId);

		if (!dbResult) throw new Error('User not found.');
		if (dbResult.verified === 1) throw new Error('User is already verified.');

		const now = moment();
		const tokenExpiration = moment().add(24, 'hours');

		const token = await signToken<RegistrationToken>({
			userId: dbResult.userId,
			iat: now.unix(),
			exp: tokenExpiration.unix(),
		});

		await mailClient.sendUserRegistrationEmail([dbResult.email], {
			username: dbResult.username,
			token,
		});

		return { status: 'success' };
	} catch (error: any) {
		return { status: 'error', error: error.message };
	}
}

export async function resendVerificationEmailByEmail(email: string): Promise<QueryResult> {
	try {
		const dbResult = await userRepo.findVerificationInfoByEmail(email);

		if (!dbResult) throw new Error('No account found with this email address.');
		if (dbResult.verified === 1) throw new Error('This account is already verified. You can log in.');

		const now = moment();
		const tokenExpiration = moment().add(24, 'hours');

		const token = await signToken<RegistrationToken>({
			userId: dbResult.userId,
			iat: now.unix(),
			exp: tokenExpiration.unix(),
		});

		await mailClient.sendUserRegistrationEmail([dbResult.email], {
			username: dbResult.username,
			token,
		});

		return { status: 'success' };
	} catch (error: any) {
		return { status: 'error', error: error.message };
	}
}

export async function requestPasswordReset(email: string): Promise<QueryResult> {
	try {
		const dbResult = await userRepo.findVerificationInfoByEmail(email);

		if (!dbResult) {
			// don't reveal if email exists
			return { status: 'success' };
		}

		const now = moment();
		const tokenExpiration = moment().add(1, 'hour');

		const token = await signToken<PasswordResetToken>({
			userId: dbResult.userId,
			email: dbResult.email,
			type: 'password-reset',
			iat: now.unix(),
			exp: tokenExpiration.unix(),
		});

		await mailClient.sendPasswordResetEmail([dbResult.email], {
			username: dbResult.username,
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

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<QueryResult> {
	try {
		const { valid, expired, payload } = await verifyPasswordResetToken(token);

		if (!valid || !payload?.userId) {
			throw new Error('Invalid password reset link.');
		}

		if (expired) {
			throw new Error('Password reset link has expired. Please request a new one.');
		}

		const hashedPassword = await hashPassword(newPassword);
		const result = await userRepo.updatePassword(payload.userId, hashedPassword);

		if (result === 0) {
			throw new Error('User not found.');
		}

		return { status: 'success' };
	} catch (error: any) {
		return { status: 'error', error: error.message };
	}
}

export async function forceResetPassword(userId: string, newPassword: string): Promise<boolean> {
	try {
		const hashedPassword = await hashPassword(newPassword);
		const result = await userRepo.updatePassword(userId, hashedPassword);
		return result === 1;
	} catch (error: any) {
		console.error(error);
		return false;
	}
}

export async function resetPassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
	try {
		const userRecord = await userRepo.findPasswordHash(userId);
		if (!userRecord) return false;

		const isValid = await comparePassword(oldPassword, userRecord.password);
		if (!isValid) return false;

		const hashedPassword = await hashPassword(newPassword);
		const result = await userRepo.updatePassword(userId, hashedPassword);
		return result === 1;
	} catch (error: any) {
		console.error(error);
		return false;
	}
}

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

export const getInvitations = userRepo.getInvitations.bind(userRepo);
export const createInvitation = userRepo.createInvitation.bind(userRepo);
export const deleteInvitation = userRepo.deleteInvitation.bind(userRepo);

export const createInvitationRequest = userRepo.createInvitationRequest.bind(userRepo);
export const getInvitationRequests = userRepo.getInvitationRequests.bind(userRepo);
export const getPendingInvitationRequestCount =
	userRepo.getPendingInvitationRequestCount.bind(userRepo);
export const fulfillInvitationRequest = userRepo.fulfillInvitationRequest.bind(userRepo);
export const rejectInvitationRequest = userRepo.rejectInvitationRequest.bind(userRepo);

export const isInviteOnly = settingsRepo.isInviteOnly.bind(settingsRepo);
export const setAppSetting = settingsRepo.set.bind(settingsRepo);

export function hasGlobalPermission(
	user: { permissions?: Array<{ permissionName: string }> } | undefined,
	permission: string
): boolean {
	return user?.permissions?.some((p) => p.permissionName === permission) ?? false;
}
