const { MAILGUN_KEY } = process.env;

import FormData from "form-data";
import Mailgun from "mailgun.js";


export interface IUserRegistrationEmailParams {
  username: string,
  token: string;
};

export interface IPasswordResetEmailParams {

}


export class MailClient {

  // TODO: move this to env var in case we want separate domains
  private static domain: string = "busserapp.com";
  private static from: string = "The Busser Team <noreply@busserapp.com>";
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
      const messageResult = await MailClient.client.messages.create(MailClient.domain, {
        from: MailClient.from,
        to,
        subject: "Welcome to Busser",
        template: "user registration",
        "h:X-Mailgun-Variables": JSON.stringify({ 
          url: 'http://localhost:5173',
          username, 
          token 
        }),
      });

      console.log(messageResult);
    } catch(error: any) {
      console.error(error.message);
    }
  }

  public async sendPasswordResetEmail({ }: IPasswordResetEmailParams) {

  }
}

