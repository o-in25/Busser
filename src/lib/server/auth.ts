import type {Cookies} from '@sveltejs/kit';
import {DbProvider} from './db';
import {Logger} from './logger';
import type {User} from '$lib/types/auth';
import jwt, {type SignOptions} from 'jsonwebtoken';
import {promisify} from 'util';
import { compare, hash } from 'bcrypt'

const { JWT_SIGNING_KEY } = process.env;
const HASH_ROUNDS = 10;

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
		jwt.sign(JSON.parse(JSON.stringify(payload)), JWT_SIGNING_KEY, {algorithm: 'HS256'}, (err, token) => {
			if (err) {
				return reject(err);
			}
			return resolve(token as string);
		});
	});
};

export async function hashPassword(password: string) {
  const hashedPassword = await hash(password, HASH_ROUNDS);
  return hashedPassword;
}

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
    // get user password
    const { userId, password: hashedPassword } = await db.table('user').where({ username }).select('userId', 'password').first();
    if(!userId || !password) {
      throw new Error('User not found.');
    }

    // check password
    const isValid = await compare(password, hashedPassword);
    if(!isValid) {
      throw new Error('Incorrect password.');
    }

    // get user (could be combined in first query)
    const user = await db.table<User>('user').where({ userId }).select().first();
    if(!user) {
      throw new Error('Could not obtain user data.');
    }

    // get grants
    const { permissions, roles } = await db.table('userAccessControl').where({ userId }).select().first();
    if(!permissions?.length || !roles.length) {
      throw new Error('Could not obtain user grants.');
    }

    // set grants
    user.permissions = permissions?.split(',');
		user.roles = roles?.split(',');

    // sign token
    const userToken = await signUserToken(user);
    return userToken;

	} catch (error: any) {
    await Logger.error(error);
    if(username) {
      await Logger.info(`User ${username} attempted to sign in.`);
    }
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
    const oldHashedPassword = await hashPassword(oldPassword);
    const newHashedPassword = await hashPassword(newPassword);
		const result: any = await db
			.table('user')
			.where({userId, password: oldHashedPassword})
			.update(
				{
					password: newHashedPassword,
				},
				['userId', 'username', 'email']
			);
		return result === 1;
	} catch (error: any) {
		console.error(error);
		return false;
	}
}
