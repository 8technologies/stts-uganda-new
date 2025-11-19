import { GraphQLError } from "graphql";
import nodemailer from "nodemailer";

async function sendEmail({
  to,
  subject,
  message,
  html,
  attachments, // optional: nodemailer attachments array
  from = "darlingtonakampa720@gmail.com",
}) {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "tredumollc@gmail.com",
        pass: "zykiwbbaffehohlb",
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
    throw new GraphQLError("server error: Failed to send emails");
    // console.log("server error: Failed to send emails");
  }
}

// sendEmail('dakampereza.std@nkumbauniversity.ac.ug', '123456');
export default sendEmail;
