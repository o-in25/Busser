const { MAILGUN_KEY, APP_URL } = process.env;

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

export interface IUserRegistrationEmailParams {
	username: string;
	token: string;
}

export interface IPasswordResetEmailParams {
	username: string;
	token: string;
}

export interface IWorkspaceInvitationEmailParams {
	workspaceName: string;
	inviterName: string;
	invitationCode: string;
	role: 'owner' | 'editor' | 'viewer';
}

export class MailClient {
	private static domain: string = 'busserapp.com';
	private static from: string = 'The Busser Team <noreply@busserapp.com>';
	private static baseUrl: string = APP_URL || 'https://busserapp.com';
	private static mailgun = new Mailgun(FormData);
	private static client = this.mailgun.client({
		username: 'api',
		key: MAILGUN_KEY || '',
	});

	constructor(domain: string = MailClient.domain) {
		MailClient.domain = domain;
	}

	public async sendUserRegistrationEmail(
		to: string[],
		{ username, token }: IUserRegistrationEmailParams
	): Promise<boolean> {
		try {
			if (!MAILGUN_KEY) {
				console.error('MAILGUN_KEY is not configured');
				throw new Error('Email service is not configured.');
			}

			await MailClient.client.messages.create(MailClient.domain, {
				from: MailClient.from,
				to,
				subject: 'Welcome to Busser',
				template: 'user-registration-email',
				'h:X-Mailgun-Variables': JSON.stringify({
					url: MailClient.baseUrl,
					username,
					token,
				}),
			});

			return true;
		} catch (error: any) {
			console.error('Failed to send registration email:', error.message);
			console.error('Full error:', error);
			throw new Error(`Failed to send verification email: ${error.message}`);
		}
	}

	public async sendPasswordResetEmail(
		to: string[],
		{ username, token }: IPasswordResetEmailParams
	): Promise<boolean> {
		try {
			if (!MAILGUN_KEY) {
				console.error('MAILGUN_KEY is not configured');
				throw new Error('Email service is not configured.');
			}

			await MailClient.client.messages.create(MailClient.domain, {
				from: MailClient.from,
				to,
				subject: 'Reset your Busser password',
				template: 'password-reset-email',
				'h:X-Mailgun-Variables': JSON.stringify({
					url: MailClient.baseUrl,
					username,
					token,
				}),
			});

			return true;
		} catch (error: any) {
			console.error('Failed to send password reset email:', error.message);
			console.error('Full error:', error);
			throw new Error(`Failed to send password reset email: ${error.message}`);
		}
	}

	public async sendWorkspaceInvitationEmail(
		to: string[],
		{ workspaceName, inviterName, invitationCode, role }: IWorkspaceInvitationEmailParams
	): Promise<boolean> {
		try {
			if (!MAILGUN_KEY) {
				console.error('MAILGUN_KEY is not configured');
				throw new Error('Email service is not configured.');
			}

			await MailClient.client.messages.create(MailClient.domain, {
				from: MailClient.from,
				to,
				subject: `You've been invited to join ${workspaceName} on Busser`,
				template: 'workspace-invitation-email',
				'h:X-Mailgun-Variables': JSON.stringify({
					url: MailClient.baseUrl,
					workspaceName,
					inviterName,
					invitationCode,
					role,
				}),
			});

			return true;
		} catch (error: any) {
			console.error('Failed to send workspace invitation email:', error.message);
			console.error('Full error:', error);
			throw new Error(`Failed to send workspace invitation email: ${error.message}`);
		}
	}
}
