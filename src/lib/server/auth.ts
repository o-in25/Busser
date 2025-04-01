import type {Cookies} from '@sveltejs/kit';
import {DbProvider} from './db';
import sha256 from 'crypto-js/sha256';
import {Logger} from './logger';
import type {User} from '$lib/types/auth';
import jwt, {type SignOptions} from 'jsonwebtoken';
import {promisify} from 'util';

const {JWT_SIGNING_KEY} = process.env;

const db = new DbProvider('user_t');

const verifyUserToken = (token: string): Promise<User> => {
	return new Promise((resolve, reject) => {
		if (!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
		jwt.verify(token, JWT_SIGNING_KEY || '', (err, decoded) => {
			if (err) {
				return reject(err);
			}
			return resolve(decoded as User);
		});
	});
};

const signUserToken = (payload: User): Promise<string> => {
	return new Promise((resolve, reject) => {
		if (!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
		jwt.sign(payload, JWT_SIGNING_KEY, {algorithm: 'HS256'}, (err, token) => {
			if (err) {
				return reject(err);
			}
			return resolve(token as string);
		});
	});
};

export const hashPassword = (password: string) => sha256(password).toString();

// just verifies the jwt
export async function authenticate(
	userToken: string | undefined
): Promise<User | null> {
	try {
		if (!userToken) return null;
		const user = (await verifyUserToken(userToken)) as User;
		return user;
	} catch (error: any) {
		console.error(error);
		return null;
	}
}

// signs token and return the jwt (instead of the user)
export async function login(
	username: string,
	password: string
): Promise<string | null> {
	try {
		const user = Object.assign(
			{},
			await db
				.table('userAccessControl')
				.where('username', username)
				.andWhere('password', hashPassword(password))
				.select('userId', 'username', 'email', 'permissions', 'roles')
				.first()
		);
		if (!user?.userId) throw Error('User not found.');
		user.permissions = user.permissions?.split(',');
		user.roles = user.roles?.split(',');
		await db
			.table<User>('user')
			.update({
				lastActivityDate: Logger.now(),
				// TODO: add any session data here
			})
			.where({
				username,
			});

		const userToken = signUserToken(user);
		return userToken;
	} catch (error: any) {
		await Logger.info(`User ${username} attempted to sign in.`);
		console.error(error);
		return null;
	}
}

export async function resetPassword(
	userId: string,
	oldPassword: string,
	newPassword: string
): Promise<boolean> {
	try {
		const result: any = await db
			.table('user')
			.where({userId, password: hashPassword(oldPassword)})
			.update(
				{
					password: hashPassword(newPassword),
				},
				['userId', 'username', 'email']
			);
		return result === 1;
	} catch (error: any) {
		console.error(error);
		return false;
	}
}
