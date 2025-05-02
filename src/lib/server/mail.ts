const { MAILGUN_KEY } = process.env;

import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { Logger } from "./logger";

export async function sendSimpleMessage() {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: MAILGUN_KEY || ''
  });

  try {
    const data = await mg.messages.create("busserapp.com", {
      from: "Busser <noreply@busserapp.com>",
      to: ["Eoin Halligan <eoinhalligan3@gmail.com>"],
      subject: "Welcome to Busser!",
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