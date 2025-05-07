const { MAILGUN_KEY } = process.env;

import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { Logger } from "./logger";
import { user } from "../../stores";

const mailgun = new Mailgun(FormData);
const mailClient = mailgun.client({
  username: "api",
  key: MAILGUN_KEY || ''
});

export async function sendRegisterUserEmail(to: string[], username: string, token: string) {
  try {
    await mailClient.messages.create("busserapp.com", {
      from: "Busser <noreply@busserapp.com>",
      to,
      subject: "Welcome to Busser!",
      template: "user registration",
      "h:X-Mailgun-Variables": JSON.stringify({
        username, token
      }),
    });
  } catch(error: any) {
    Logger.error(error.message)
  }
}