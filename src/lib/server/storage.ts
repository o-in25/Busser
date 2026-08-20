import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import moment from 'moment';

import { DbProvider } from './db';
import { compressImage } from './image';
import { getCredentials } from './google';
import { Logger } from './logger';

import { env } from '$env/dynamic/private';

const { BUCKET, USER_TABLE } = env;

const { client_email, private_key } = getCredentials();
const storage = new Storage({
	credentials: {
		client_email,
		private_key,
	},
});

// lazy: gcs throws on an empty bucket name, and the build's analyse step imports this module
let _bucket: ReturnType<typeof storage.bucket> | null = null;
function getBucket() {
	if (!_bucket) {
		if (!BUCKET) throw new Error('BUCKET is not configured');
		_bucket = storage.bucket(BUCKET);
	}
	return _bucket;
}

const db = new DbProvider(USER_TABLE || '');

export type Upload = {
	uploadId?: string;
	externalUploadId: string;
	publicUrl: string;
	name: string;
	bucket: string;
	contentType: string;
	size: number;
};

export type UploadResult = {
	status: 'success' | 'error';
	message?: string;
};

export type UploadKind = 'recipes' | 'ingredients' | 'ai-generated';

export async function deleteSignedUrl(signedUrl: string): Promise<UploadResult> {
	try {
		const row = Object.assign(
			{},
			await db
				.table<Upload>('upload')
				.select('name', 'bucket')
				.where('publicUrl', signedUrl)
				.andWhere('status', 'ACTIVE')
				.first()
		);

		if (!row?.name || !row?.bucket) {
			// legacy/backfilled image without an upload row — nothing tracked to delete, so skip.
			// don't touch the untracked gcs object (could be shared/seeded).
			const message = `deleteSignedUrl: no active upload record for ${signedUrl}, skipping cleanup`;
			console.warn(message);
			await Logger.info(message);
			return {
				status: 'success',
				message: 'No upload record; nothing to delete.',
			} satisfies UploadResult;
		}

		await storage.bucket(row.bucket).file(row.name).delete();

		await db
			.table<Upload>('upload')
			.where('name', row.name)
			.andWhere('bucket', row.bucket)
			.update('status', 'DELETED');

		return {
			status: 'success',
			message: `Signed URL ${signedUrl} successfully deleted.`,
		} satisfies UploadResult;
	} catch (error: any) {
		console.error(error);
		Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
		return {
			status: 'error',
			message: `Could not delete signed URL ${signedUrl}. Check the logs for more details.`,
		} satisfies UploadResult;
	}
}

export async function getSignedUrl(
	file: File,
	fileName: string,
	kind: UploadKind,
	workspaceId: string
): Promise<string> {
	try {
		const blob = await file.arrayBuffer();
		const { data, contentType } = await compressImage(Buffer.from(blob));
		const ext = contentType === 'image/svg+xml' ? 'svg' : 'webp';
		// drop the original extension — the stored bytes are webp now
		const safeName = (fileName || file.name)
			.replace(/[^a-zA-Z0-9._-]+/g, '-')
			.replace(/\.[^.]+$/, '');
		const name = `${kind}/${workspaceId}/${safeName}-${moment().format('MMDDYYYYSS')}.${ext}`;
		const newFile = getBucket().file(name);
		await newFile.save(data, { contentType });

		const publicUrl = newFile.publicUrl();
		const [metadata] = await newFile.getMetadata();
		// save a ref of the image so we can delete it later
		await db.table<Upload>('upload').insert({
			uploadId: crypto.randomUUID(),
			externalUploadId: metadata.id,
			name: metadata.name,
			bucket: metadata.bucket,
			contentType: metadata.contentType,
			size: parseInt(metadata.size?.toString() || '0'),
			publicUrl,
		});
		return publicUrl;
	} catch (error) {
		console.error(error);
		return '';
	}
}

// copies a GCS file to a new workspace-scoped location and returns the new public url.
// uses gcs server-side copy — no download/upload round-trip.
// note: runs outside db transactions; a rollback after copy orphans the gcs file.
export async function copyGcsFile(
	sourceUrl: string,
	kind: UploadKind,
	workspaceId: string
): Promise<string> {
	try {
		const sourceRow = await db
			.table<Upload>('upload')
			.select('name', 'bucket', 'contentType')
			.where('publicUrl', sourceUrl)
			.andWhere('status', 'ACTIVE')
			.first();

		if (!sourceRow?.name || !sourceRow?.bucket) {
			// legacy data without an upload row — fall back to sharing the url
			console.warn(`copyGcsFile: no upload record for ${sourceUrl}, returning original url`);
			return sourceUrl;
		}

		const basename = sourceRow.name.split('/').pop() || sourceRow.name;
		const destName = `${kind}/${workspaceId}/${basename}-${moment().format('MMDDYYYYSS')}`;
		const sourceFile = storage.bucket(sourceRow.bucket).file(sourceRow.name);
		const destFile = getBucket().file(destName);

		await sourceFile.copy(destFile);

		const [metadata] = await destFile.getMetadata();
		const publicUrl = destFile.publicUrl();

		await db.table<Upload>('upload').insert({
			uploadId: crypto.randomUUID(),
			externalUploadId: metadata.id,
			name: metadata.name,
			bucket: metadata.bucket,
			contentType: metadata.contentType || sourceRow.contentType,
			size: parseInt(metadata.size?.toString() || '0'),
			publicUrl,
		});

		return publicUrl;
	} catch (error: any) {
		console.error('copyGcsFile error:', error);
		Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
		// on failure, fall back to the source url so the import still succeeds
		return sourceUrl;
	}
}

export async function uploadAvatarBuffer(
	buffer: Buffer,
	userId: string,
	contentType: string = 'image/svg+xml'
): Promise<string> {
	try {
		const ext = contentType.includes('svg') ? 'svg' : contentType.split('/')[1] || 'png';
		const name = `avatars/${userId}/${Date.now()}.${ext}`;
		const newFile = getBucket().file(name);

		await newFile.save(buffer, { contentType });

		const publicUrl = newFile.publicUrl();
		const [metadata] = await newFile.getMetadata();

		await db.table<Upload>('upload').insert({
			uploadId: crypto.randomUUID(),
			externalUploadId: metadata.id,
			name: metadata.name,
			bucket: metadata.bucket,
			contentType: metadata.contentType,
			size: parseInt(metadata.size?.toString() || '0'),
			publicUrl,
		});

		return publicUrl;
	} catch (error) {
		console.error(error);
		return '';
	}
}

// 15 minutes expiration
export async function getSignedUrlFromUnsignedUrl(
	unsignedUrl: string,
	expires: number = 15 * 60 * 1000
) {
	const match = unsignedUrl.match(/https:\/\/storage\.googleapis\.com\/[^/]+\/(.+)$/);
	const fileName = match?.[1] ?? '';
	const file = getBucket().file(fileName);
	const [signedUrl] = await file.getSignedUrl({
		version: 'v4',
		action: 'read',
		expires: Date.now() + expires,
	});

	return signedUrl;
}
