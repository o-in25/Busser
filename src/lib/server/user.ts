// user service
import type { QueryResult } from '$lib/types';

import {
	userRepo,
	registerUser,
	verifyUser,
	resendVerificationEmail,
	resendVerificationEmailByEmail,
	requestPasswordReset,
} from './auth';
import { generateRandomShapeAvatar } from './generators/avatar-generator';
import { deleteSignedUrl, uploadAvatarBuffer } from './storage';

export { userRepo };

export const getUsers = userRepo.findAll.bind(userRepo);
export const getUser = userRepo.findById.bind(userRepo);
export const addUser = userRepo.create.bind(userRepo);
export const editUser = userRepo.update.bind(userRepo);
export const deleteUser = userRepo.delete.bind(userRepo);
export const getUsersInOwnedWorkspaces = userRepo.getUsersInOwnedWorkspaces.bind(userRepo);
export const getInvitableUsers = userRepo.getInvitableUsers.bind(userRepo);

export const createRole = userRepo.createRole.bind(userRepo);
export const roleSelect = userRepo.getRoleOptions.bind(userRepo);
export const getGrants = userRepo.getGrants.bind(userRepo);
export const updateGrants = userRepo.updateGrants.bind(userRepo);

export { registerUser, verifyUser, resendVerificationEmail, resendVerificationEmailByEmail, requestPasswordReset };

export const createInvitation = userRepo.createInvitation.bind(userRepo);
export const getWorkspaceInvitations = userRepo.getWorkspaceInvitations.bind(userRepo);
export const deleteInvitation = userRepo.deleteInvitation.bind(userRepo);
export const getInvitationByCode = userRepo.getInvitationByCode.bind(userRepo);
export const acceptWorkspaceInvitation = userRepo.acceptWorkspaceInvitation.bind(userRepo);

export const getPreferredWorkspaceId = userRepo.getPreferredWorkspaceId.bind(userRepo);
export const setPreferredWorkspaceId = userRepo.setPreferredWorkspaceId.bind(userRepo);

export async function generateAndUploadAvatar(userId: string): Promise<QueryResult<string>> {
	try {
		const currentUrl = await userRepo.findAvatarUrl(userId);
		if (currentUrl) {
			await deleteSignedUrl(currentUrl);
		}

		const avatar = generateRandomShapeAvatar(`${userId}-${Date.now()}`);
		const publicUrl = await uploadAvatarBuffer(avatar.buffer, userId, 'image/svg+xml');

		if (!publicUrl) {
			return { status: 'error', error: 'Failed to upload avatar.' };
		}

		await userRepo.updateAvatarUrl(userId, publicUrl);
		return { status: 'success', data: publicUrl };
	} catch (error: any) {
		console.error('Error generating avatar:', error.message);
		return { status: 'error', error: 'Failed to generate avatar.' };
	}
}

export async function uploadCustomAvatar(userId: string, file: File): Promise<QueryResult<string>> {
	try {
		const currentUrl = await userRepo.findAvatarUrl(userId);
		if (currentUrl) {
			await deleteSignedUrl(currentUrl);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const publicUrl = await uploadAvatarBuffer(buffer, userId, file.type);

		if (!publicUrl) {
			return { status: 'error', error: 'Failed to upload avatar.' };
		}

		await userRepo.updateAvatarUrl(userId, publicUrl);
		return { status: 'success', data: publicUrl };
	} catch (error: any) {
		console.error('Error uploading avatar:', error.message);
		return { status: 'error', error: 'Failed to upload avatar.' };
	}
}
