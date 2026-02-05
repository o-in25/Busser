import { Storage } from '@google-cloud/storage';
import moment from 'moment';

import { DbProvider } from './db';
import { Logger } from './logger';

const base64Decode = (str: string) => (str ? Buffer.from(str, 'base64').toString() : '{}');

let _storage: Storage;
let _bucket: ReturnType<Storage['bucket']>;
let _db: DbProvider;

function getStorage() {
	if (!_storage) {
		const { GOOGLE_SERVICE_KEY } = process.env;
		const { client_email, private_key } = JSON.parse(base64Decode(GOOGLE_SERVICE_KEY || ''));
		_storage = new Storage({ credentials: { client_email, private_key } });
	}
	return _storage;
}

function getBucket() {
	if (!_bucket) {
		const { BUCKET } = process.env;
		_bucket = getStorage().bucket(BUCKET || '');
	}
	return _bucket;
}

function getDb() {
	if (!_db) {
		const { USER_TABLE } = process.env;
		_db = new DbProvider(USER_TABLE || '');
	}
	return _db;
}

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

export async function deleteSignedUrl(signedUrl: string): Promise<UploadResult> {
	try {
		const row = Object.assign(
			{},
			await getDb()
				.table<Upload>('upload')
				.select('name', 'bucket')
				.where('publicUrl', signedUrl)
				.andWhere('status', 'ACTIVE')
				.first()
		);

		if (!row?.name || !row?.bucket) {
			throw Error('No upload record found for signed URL.');
		}

		await getStorage().bucket(row.bucket).file(row.name).delete();

		await getDb()
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

export async function getSignedUrl(file: File, fileName: string = ''): Promise<string> {
	try {
		const name = `${fileName || file.name}-${moment().format('MMDDYYYYSS')}`;
		const newFile = getBucket().file(name);
		const blob = await file.arrayBuffer();
		const data = Buffer.from(blob);
		await newFile.save(data, {
			contentType: 'image.jpeg',
		});

		const publicUrl = newFile.publicUrl();
		const [metadata] = await newFile.getMetadata();
		// save a ref of the image so we can delete it
		// later
		await getDb()
			.table<Upload>('upload')
			.insert({
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

export async function uploadAvatarBuffer(
	buffer: Buffer,
	userId: string,
	contentType: string = 'image/svg+xml'
): Promise<string> {
	try {
		const ext = contentType.includes('svg') ? 'svg' : contentType.split('/')[1] || 'png';
		const name = `avatars/${userId}-${Date.now()}.${ext}`;
		const newFile = getBucket().file(name);

		await newFile.save(buffer, { contentType });

		const publicUrl = newFile.publicUrl();
		const [metadata] = await newFile.getMetadata();

		await getDb()
			.table<Upload>('upload')
			.insert({
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
	const regex = /https:\/\/(?:[^/]+)\/(.+)/;
	let [, fileName] = unsignedUrl.match(regex) || [];
	fileName = fileName.split('/').pop() || '';
	const file = getBucket().file(fileName);
	const [signedUrl] = await file.getSignedUrl({
		version: 'v4',
		action: 'read',
		expires: Date.now() + expires,
	});

	return signedUrl;
}
