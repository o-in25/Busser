import { fail } from '@sveltejs/kit';

import { APP_VERSION } from '$env/static/private';
import { isInviteOnly, setAppSetting, userRepo } from '$lib/server/auth';
import { uploadAvatarBuffer } from '$lib/server/storage';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId || '';
	if (!userId) return { avatarImageUrl: null, appVersion: APP_VERSION || 'dev', inviteOnly: false };

	const result = await userRepo.findById(userId);
	const inviteOnly = await isInviteOnly();
	return {
		avatarImageUrl: result.status === 'success' ? result.data?.avatarImageUrl : null,
		appVersion: APP_VERSION || 'dev',
		inviteOnly,
	};
};

function dataUriToBuffer(dataUri: string): { buffer: Buffer; mimeType: string } {
	const commaIndex = dataUri.indexOf(',');
	const header = dataUri.slice(0, commaIndex);
	const data = dataUri.slice(commaIndex + 1);

	// extract mime type (handles both "data:image/svg+xml," and "data:image/svg+xml;base64,")
	const mimeMatch = header.match(/^data:([^;,]+)/);
	const mimeType = mimeMatch ? mimeMatch[1] : 'image/svg+xml';

	// check if base64 encoded or url encoded
	const isBase64 = header.includes(';base64');

	let buffer: Buffer;
	if (isBase64) {
		buffer = Buffer.from(data, 'base64');
	} else {
		// url-encoded (dicebear uses this for svg)
		buffer = Buffer.from(decodeURIComponent(data), 'utf-8');
	}

	return { buffer, mimeType };
}

export const actions: Actions = {
	saveAvatar: async ({ locals, request }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const avatarDataUri = formData.get('avatarDataUri') as string | null;

		if (!avatarDataUri) {
			return fail(400, { error: 'No avatar data provided' });
		}

		try {
			// convert data uri to buffer
			const { buffer, mimeType } = dataUriToBuffer(avatarDataUri);

			// upload to gcs
			const publicUrl = await uploadAvatarBuffer(buffer, userId, mimeType);

			if (!publicUrl) {
				return fail(500, { error: 'Failed to upload avatar' });
			}

			// update user record
			const result = await userRepo.updateAvatarUrl(userId, publicUrl);
			if (result.status === 'error') {
				return fail(500, { error: result.error });
			}

			return { success: true, avatarImageUrl: publicUrl };
		} catch (error: any) {
			console.error('Error saving avatar:', error);
			return fail(500, { error: 'Failed to save avatar' });
		}
	},

	toggleInviteOnly: async ({ request }) => {
		const formData = await request.formData();
		const enabled = formData.get('enabled') as string;
		await setAppSetting('invite_only_mode', enabled === 'true' ? 'true' : 'false');
		return { success: true };
	},
};
