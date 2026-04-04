import Mailgen from "mailgen";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({
  path: "./docker/.env",
});

const resend = new Resend(`${process.env.RESEND_API_KEY}`);

const sendMail = async ({ email, subject, text, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [email],
      subject,
      text,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`, { cause: error });
  }
};

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "My Team",
    link: process.env.CLIENT_URL,
  },
});

const emailVerificationMailBody = ({ name, emailVerificationUrl }) => {
  const email = {
    body: {
      name,
      intro: "Welcome to My Team! We're very excited to have you on board.",
      action: {
        instructions: "To get started with My Team, please click here:",
        button: {
          color: "#22BC66",
          text: "verify your email",
          link: emailVerificationUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };

  const text = mailGenerator.generatePlaintext(email);
  const html = mailGenerator.generate(email);

  return { text, html };
};

const resetPasswordRequestMailBody = ({ name, resetPasswordUrl }) => {
  const email = {
    body: {
      name,
      intro: "Welcome to teambuilder! We're very excited to have you on board.",
      action: {
        instructions: "To reset your password on Teambuilder, please click here:",
        button: {
          color: "#22BC66",
          text: "reset your password",
          link: resetPasswordUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };

  const text = mailGenerator.generatePlaintext(email);
  const html = mailGenerator.generate(email);

  return { text, html };
};

export { sendMail, emailVerificationMailBody, resetPasswordRequestMailBody };
