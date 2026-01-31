import { fail } from '@sveltejs/kit';

import { userRepo } from '$lib/server/auth';
import { uploadAvatarBuffer } from '$lib/server/storage';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.userId || '';
	if (!userId) return { avatarImageUrl: null };

	const result = await userRepo.findById(userId);
	return {
		avatarImageUrl: result.status === 'success' ? result.data?.avatarImageUrl : null,
	};
};

function dataUriToBuffer(dataUri: string): { buffer: Buffer; mimeType: string } {
	const [header, base64] = dataUri.split(',');
	const mimeMatch = header.match(/:(.*?);/);
	const mimeType = mimeMatch ? mimeMatch[1] : 'image/svg+xml';
	const buffer = Buffer.from(base64, 'base64');
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
};
