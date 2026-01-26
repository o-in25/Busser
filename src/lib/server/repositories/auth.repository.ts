// authentication repository
import type {
  PasswordResetToken,
  RegistrationToken,
  TokenResult,
  User,
  QueryResult,
} from '$lib/types';
import { DbProvider } from '../db';
import { Logger } from '../logger';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { BaseRepository, marshalToType } from './base.repository';

const { JWT_SIGNING_KEY } = process.env;
const HASH_ROUNDS = 10;

export class AuthRepository extends BaseRepository {
  constructor(db: DbProvider) {
    super(db);
  }

  // token operations
  async verifyToken<T>(token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!JWT_SIGNING_KEY) return reject(new Error('No JWT signing key found.'));
      jwt.verify(token, JWT_SIGNING_KEY, (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded as T);
      });
    });
  }

  async signToken<T>(payload: T): Promise<string> {
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

  async hashPassword(password: string): Promise<string> {
    return hash(password, HASH_ROUNDS);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  // authentication
  async authenticate(userToken: string | undefined): Promise<User | null> {
    try {
      if (!userToken) return null;
      const user = await this.verifyToken<User>(userToken);
      return user;
    } catch (error: any) {
      console.error(error);
      return null;
    }
  }

  async login(
    username: string,
    password: string,
    getUserFn: (userId: string) => Promise<QueryResult<User>>
  ): Promise<QueryResult<string | null> & { needsVerification?: boolean; email?: string }> {
    try {
      const userRecord = await this.db
        .table('user')
        .where({ username })
        .select('userId', 'email', 'password', 'verified')
        .first();

      if (!userRecord) {
        throw new Error('User not found');
      }

      const { userId, email, verified, password: hashedPassword } = userRecord;
      if (!userId || !hashedPassword) {
        throw new Error('User not found');
      }

      const isValid = await this.comparePassword(password, hashedPassword);
      if (!isValid) {
        throw new Error('Incorrect password');
      }

      const isVerified = verified === 1;
      if (!isVerified) {
        return {
          status: 'error',
          error: "Your email address hasn't been verified yet. Please check your inbox for the verification email.",
          needsVerification: true,
          email,
        };
      }

      const queryResult = await getUserFn(userId);
      if (queryResult.status === 'error') {
        throw new Error(queryResult.error);
      }

      await this.db.table('user').update({ lastActivityDate: Logger.now() }).where({ userId });
      const user = queryResult.data || ({} as User);
      const userToken = await this.signToken<User>(user);

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

  // token verification
  async verifyRegistrationToken(token: string): Promise<TokenResult<RegistrationToken>> {
    try {
      const payload = await this.verifyToken<RegistrationToken>(token);
      return { valid: true, expired: false, payload };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        const decoded = jwt.decode(token);
        return { valid: false, expired: true, payload: decoded as RegistrationToken | undefined };
      }
      return { valid: false, expired: false };
    }
  }

  async verifyPasswordResetToken(token: string): Promise<TokenResult<PasswordResetToken>> {
    try {
      const payload = await this.verifyToken<PasswordResetToken>(token);
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

  // password reset with token
  async resetPasswordWithToken(token: string, newPassword: string): Promise<QueryResult> {
    try {
      const { valid, expired, payload } = await this.verifyPasswordResetToken(token);

      if (!valid || !payload?.userId) {
        throw new Error('Invalid password reset link.');
      }

      if (expired) {
        throw new Error('Password reset link has expired. Please request a new one.');
      }

      const hashedPassword = await this.hashPassword(newPassword);

      const result = await this.db
        .table('user')
        .where({ userId: payload.userId })
        .update({ password: hashedPassword });

      if (result === 0) {
        throw new Error('User not found.');
      }

      return { status: 'success' };
    } catch (error: any) {
      return { status: 'error', error: error.message };
    }
  }

  // legacy reset password (compare old password)
  async resetPassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // get current password hash
      const userRecord = await this.db
        .table('user')
        .where({ userId })
        .select('password')
        .first();

      if (!userRecord) return false;

      const isValid = await this.comparePassword(oldPassword, userRecord.password);
      if (!isValid) return false;

      const newHashedPassword = await this.hashPassword(newPassword);
      const result = await this.db
        .table('user')
        .where({ userId })
        .update({ password: newHashedPassword });

      return result === 1;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  }
}
