import { GraphQLError } from "graphql";
import nodemailer from "nodemailer";

async function sendEmail({
  to,
  subject,
  message,
  html,
  attachments, // optional: nodemailer attachments array
  from = "info@seedtracking.net",
}) {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "ict4personswithdisabilities.org",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        // user: "info@seedtracking.net",
        // pass: "oY8p5l*A#!Tk",
        user: "info@ict4personswithdisabilities.org",
        pass: "Qha)J,!0Nmu^R~8^",
      },
    });

    console.log("Sending mail");

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: message, // plain text body
      html: html,
      attachments: attachments,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Email send failure:", {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      command: error?.command,
    });
    throw new GraphQLError("server error: Failed to send emails");
    // console.log("server error: Failed to send emails");
  }
}

// sendEmail('dakampereza.std@nkumbauniversity.ac.ug', '123456');
export default sendEmail;
