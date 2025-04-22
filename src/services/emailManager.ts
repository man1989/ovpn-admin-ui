// const nodemailer = require('nodemailer');
import nodemailer, {SendMailOptions} from "nodemailer"
// import {} from 
// const db = require("nibble-db");
// const fs = require("fs");

// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_PROVIDER, // Use the email service you prefer (e.g., Gmail, Outlook, etc.)
  auth: {
    user: process.env.EMAIL_AUTH_USER, // Your email address
    pass: process.env.EMAIL_AUTH_PASS, // Your email password or app password if 2FA is enabled
  },
});

// Function to send OTP via email
export async function sendFileByEmail(email: string, content: string) {
  if(process.env.EMAIL_DOMAIN && !email.endsWith(`@${process.env.EMAIL_DOMAIN}`)){
    throw new Error("Invalid email")
  }
  // Define the email message
  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_FROM,
    to: email, // Recipient's email address
    subject: 'Your openvpn file',
    text: `Please find your file under attachment.\nPlease do not share this file`,
    attachments: [{
      content: content,
      filename: `${email.replace(/@.*/, "")}.ovpn`
    }]
  };

  // Send the email
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
      } else {
        console.log('email sent:', info.response);
        resolve(info.response);
      }
    });
  });
}