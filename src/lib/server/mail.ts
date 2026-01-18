const { MAILGUN_KEY, APP_URL } = process.env;

import FormData from "form-data";
import Mailgun from "mailgun.js";


export interface IUserRegistrationEmailParams {
  username: string,
  token: string;
};

export interface IPasswordResetEmailParams {

}


export class MailClient {

  private static domain: string = "busserapp.com";
  private static from: string = "The Busser Team <noreply@busserapp.com>";
  private static baseUrl: string = APP_URL || 'https://busser.fly.dev';
  private static mailgun = new Mailgun(FormData);
  private static client = this.mailgun.client({
    username: "api",
    key: MAILGUN_KEY || ''
  });

  constructor(domain: string = MailClient.domain) {
    MailClient.domain = domain;
  }

  public async sendUserRegistrationEmail(to: string[], { username, token }: IUserRegistrationEmailParams) {
    try {
      await MailClient.client.messages.create(MailClient.domain, {
        from: MailClient.from,
        to,
        subject: "Welcome to Busser",
        template: "user registration",
        "h:X-Mailgun-Variables": JSON.stringify({
          url: MailClient.baseUrl,
          username,
          token
        }),
      });
    } catch(error: any) {
      console.error('Failed to send registration email:', error.message);
    }
  }

  public async sendPasswordResetEmail({ }: IPasswordResetEmailParams) {

  }
}

