import { DbProvider } from './db';
import { Logger } from './logger';
import type { Invitation, RegistrationToken, TokenResult, User } from '$lib/types/auth';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { getUser } from './user';
import { generateSecureCode } from '$lib/math';
import { marshalToType } from './core';
import type { QueryResult } from '$lib/types';

const { JWT_SIGNING_KEY } = process.env;
const HASH_ROUNDS = 10;

const db = new DbProvider('user_t');

export const verifyToken = async <T> (token: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    if(!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
    jwt.verify(token, JWT_SIGNING_KEY || '', (err, decoded) => {
      if(err) {
        return reject(err);
      }

      return resolve(decoded as T);
    });
  });
};

export const signToken = async <T> (payload: T): Promise<string> => {
  return new Promise((resolve, reject) => {
    if(!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
    jwt.sign(JSON.parse(JSON.stringify(payload)), JWT_SIGNING_KEY, { algorithm: 'HS256' }, (err, token) => {
      if(err) {
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
    if(!userToken) return null;
    const user = (await verifyToken<User>(userToken)) as User;
    return user;
  } catch(error: any) {
    console.error(error);
    return null;
  }
}

// signs token and return the jwt (instead of the user)
export async function login(
  username: string,
  password: string
): Promise<QueryResult<string | null>> {
  try {
    // get user password
    const { userId, verified, password: hashedPassword } = await db.table('user')
    .where({ username })
    .select('userId', 'password', 'verified').first();
    if(!userId || !password) {
      // TODO: hash the password here anyways to prevent a timing attack
      throw new Error('User not found');
    }

    // check password
    const isValid = await compare(password, hashedPassword);
    if(!isValid) {
      throw new Error('Incorrect password');
    }

    // check if verified
    const isVerified = verified ===  1;
    if(!isVerified) {
      throw new Error('Email not verified');
    }

    const queryResult = await getUser(userId);
    if(queryResult.status === 'error') {
      throw new Error(queryResult.error);
    }

    // update activity date
    await db.table('user').update({ lastActivityDate: Logger.now() }).where({ userId });
    const user = queryResult.data || {} as User;
    const userToken = await signToken<User>(user);


    return {
      status: 'success',
      data: userToken
    };
  } catch(error: any) {
    await Logger.error(error.message);
    if(username) {
      await Logger.info(`User ${username} attempted to sign in.`);
    }

    const getFriendlyError = ({ message }): string => {
      const messages = {
        'User not found': 'Invalid username or password.',
        'Incorrect password': 'Invalid username or password.',
        'Email not verified': 'Your email address hasn’t been verified yet. Please check your inbox for the verification email and follow the instructions to activate your account.'
      }

      return messages[message] || 'An unknown error occurred.';
    }

    return {
      status: 'error',
      error: getFriendlyError(error)
    };
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
      .where({ userId, password: oldHashedPassword })
      .update(
        {
          password: newHashedPassword,
        },
        ['userId', 'username', 'email']
      );
    return result === 1;
  } catch(error: any) {
    console.error(error);
    return false;
  }
}

export async function getInvitations(): Promise<QueryResult<Invitation[]>> {
  try {
    let dbResult = await db.table('invitation').select();
    const invitations: Invitation[] = marshalToType<Invitation[]>(dbResult);
    return {
      status: 'success',
      data: invitations
    }
  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error
    };
  }
}

export async function createInvite() {
  try {
    await db.table('invitation').insert({
      code: generateSecureCode(), 
      createdAt: Logger.now(),
      usedAt: null,
      usedBy: null,
      email: null,
      expiresAt: null
    })
  } catch(error: any) {
    console.error('Failed to generate invite code:', error.message);
  }
}

export async function checkInviteCode(code: string) {
  try {

  } catch(error: any) {
    console.error('Failed to check invite code:', error.message);
  }
}

export const verifyRegistrationToken = async (token: string): Promise<TokenResult<RegistrationToken>> => {
  try {
    const payload = await verifyToken<RegistrationToken>(token);
    return {
      valid: true,
      expired: false,
      payload,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // Signature is valid but token is expired
      const decoded = jwt.decode(token);
      return {
        valid: false,
        expired: true,
        payload: decoded as RegistrationToken | undefined,
      };
    }

    return {
      valid: false,
      expired: false,
    };
  }
};