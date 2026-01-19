import { DbProvider } from './db';
import { Logger } from './logger';
import type { Invitation, InvitationRequest, PasswordResetToken, RegistrationToken, TokenResult, User } from '$lib/types/auth';
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
): Promise<QueryResult<string | null> & { needsVerification?: boolean; email?: string }> {
  try {
    // get user password
    const userRecord = await db.table('user')
      .where({ username })
      .select('userId', 'email', 'password', 'verified')
      .first();

    if(!userRecord) {
      // TODO: hash the password here anyways to prevent a timing attack
      throw new Error('User not found');
    }

    const { userId, email, verified, password: hashedPassword } = userRecord;
    if(!userId || !hashedPassword) {
      throw new Error('User not found');
    }

    // check password
    const isValid = await compare(password, hashedPassword);
    if(!isValid) {
      throw new Error('Incorrect password');
    }

    // check if verified
    const isVerified = verified === 1;
    if(!isVerified) {
      return {
        status: 'error',
        error: 'Your email address hasn\'t been verified yet. Please check your inbox for the verification email.',
        needsVerification: true,
        email
      };
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

    const getFriendlyError = ({ message }: { message: string }): string => {
      const messages: Record<string, string> = {
        'User not found': 'Invalid username or password.',
        'Incorrect password': 'Invalid username or password.'
      };

      // Check for known messages
      if (messages[message]) {
        return messages[message];
      }

      // Handle database/destructuring errors that indicate user not found
      if (message.includes('Cannot destructure') || message.includes('undefined')) {
        return 'Invalid username or password.';
      }

      return 'An error occurred while logging in. Please try again.';
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

export async function createInvitation(
  email: string | null = null,
  expiresAt: string | null = null,
  invitationCode: string | null = null
): Promise<QueryResult<Invitation>> {
  try {
    const code = invitationCode?.trim() || generateSecureCode();

    const [invitationId] = await db.table('invitation').insert({
      invitationCode: code,
      email: email?.trim() || null,
      createdAt: Logger.now(),
      issuedAt: Logger.now(),
      expiresAt: expiresAt || null,
      userId: null,
      lastSentAt: null
    });

    const dbResult = await db.table('invitation').where({ invitationId }).first();
    const invitation = marshalToType<Invitation>(dbResult);

    return {
      status: 'success',
      data: invitation
    };
  } catch(error: any) {
    console.error('Failed to create invitation:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function deleteInvitation(invitationId: number): Promise<QueryResult<number>> {
  try {
    const rowsDeleted = await db.table('invitation').where({ invitationId }).del();

    if(rowsDeleted === 0) {
      throw new Error('Invitation not found.');
    }

    return {
      status: 'success',
      data: rowsDeleted
    };
  } catch(error: any) {
    console.error('Failed to delete invitation:', error.message);
    return {
      status: 'error',
      error: error.message
    };
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

export const verifyPasswordResetToken = async (token: string): Promise<TokenResult<PasswordResetToken>> => {
  try {
    const payload = await verifyToken<PasswordResetToken>(token);

    // Verify it's actually a password reset token
    if (payload.type !== 'password-reset') {
      return {
        valid: false,
        expired: false,
      };
    }

    return {
      valid: true,
      expired: false,
      payload,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      const decoded = jwt.decode(token);
      return {
        valid: false,
        expired: true,
        payload: decoded as PasswordResetToken | undefined,
      };
    }

    return {
      valid: false,
      expired: false,
    };
  }
};

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<QueryResult> {
  try {
    const { valid, expired, payload } = await verifyPasswordResetToken(token);

    if (!valid || !payload?.userId) {
      throw new Error('Invalid password reset link.');
    }

    if (expired) {
      throw new Error('Password reset link has expired. Please request a new one.');
    }

    const hashedPassword = await hashPassword(newPassword);

    const result = await db.table('user')
      .where({ userId: payload.userId })
      .update({ password: hashedPassword });

    if (result === 0) {
      throw new Error('User not found.');
    }

    return { status: 'success' };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Invitation Request Functions

export async function createInvitationRequest(
  email: string,
  message?: string | null
): Promise<QueryResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if there's already a pending request for this email
    const existingRequest = await db.table('invitationRequest')
      .where({ email: normalizedEmail, status: 'pending' })
      .first();

    if (existingRequest) {
      return {
        status: 'error',
        error: 'You have already requested an invitation. Please wait for an admin to review your request.'
      };
    }

    // Check if this email already has an invitation
    const existingInvitation = await db.table('invitation')
      .where({ email: normalizedEmail })
      .whereNull('userId') // Not yet used
      .first();

    if (existingInvitation) {
      return {
        status: 'error',
        error: 'An invitation has already been created for this email. Please check your inbox.'
      };
    }

    // Check if this email is already registered
    const existingUser = await db.table('user')
      .where({ email: normalizedEmail })
      .first();

    if (existingUser) {
      return {
        status: 'error',
        error: 'This email is already registered. Please try logging in instead.'
      };
    }

    await db.table('invitationRequest').insert({
      email: normalizedEmail,
      message: message?.trim() || null,
      status: 'pending',
      createdAt: Logger.now(),
      resolvedAt: null,
      resolvedBy: null
    });

    return {
      status: 'success'
    };
  } catch (error: any) {
    console.error('Failed to create invitation request:', error.message);
    return {
      status: 'error',
      error: 'Failed to submit your request. Please try again.'
    };
  }
}

export async function getInvitationRequests(
  status?: 'pending' | 'fulfilled' | 'rejected'
): Promise<QueryResult<InvitationRequest[]>> {
  try {
    let query = db.table('invitationRequest').orderBy('createdAt', 'desc');

    if (status) {
      query = query.where({ status });
    }

    const dbResult = await query.select();
    const requests = marshalToType<InvitationRequest[]>(dbResult);

    return {
      status: 'success',
      data: requests
    };
  } catch (error: any) {
    console.error('Failed to get invitation requests:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function getPendingInvitationRequestCount(): Promise<number> {
  try {
    const result = await db.table('invitationRequest')
      .where({ status: 'pending' })
      .count('invitationRequestId as count')
      .first() as { count: number } | undefined;

    return Number(result?.count || 0);
  } catch (error: any) {
    console.error('Failed to get pending request count:', error.message);
    return 0;
  }
}

export async function fulfillInvitationRequest(
  invitationRequestId: number,
  resolvedBy: string
): Promise<QueryResult> {
  try {
    const result = await db.table('invitationRequest')
      .where({ invitationRequestId })
      .update({
        status: 'fulfilled',
        resolvedAt: Logger.now(),
        resolvedBy
      });

    if (result === 0) {
      throw new Error('Invitation request not found.');
    }

    return { status: 'success' };
  } catch (error: any) {
    console.error('Failed to fulfill invitation request:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function rejectInvitationRequest(
  invitationRequestId: number,
  resolvedBy: string
): Promise<QueryResult> {
  try {
    const result = await db.table('invitationRequest')
      .where({ invitationRequestId })
      .update({
        status: 'rejected',
        resolvedAt: Logger.now(),
        resolvedBy
      });

    if (result === 0) {
      throw new Error('Invitation request not found.');
    }

    return { status: 'success' };
  } catch (error: any) {
    console.error('Failed to reject invitation request:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
}