const { MAILGUN_KEY } = process.env;

import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { Logger } from "./logger";

const mailgun = new Mailgun(FormData);
const mailClient = mailgun.client({
  username: "api",
  key: MAILGUN_KEY || ''
});


export async function sendSimpleMessage(to: string[], subject: string) {
  try {
    const data = await mailClient.messages.create("busserapp.com", {
      from: "Busser <noreply@busserapp.com>",
      to,
      subject,
      template: "User Registration",
      "h:X-Mailgun-Variables": JSON.stringify({
        username: "test",
        expiry: Logger.now()
      }),
    });
  } catch (error) {
    console.log(error); //logs any error
  }
}

export async function sendRegisterUserEmail(to: string[], token: string) {
  try {

  } catch(error: any) {

  }
}