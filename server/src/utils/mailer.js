import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"Chattix Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Chattix - Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #a855f7; text-align: center;">Welcome to Chattix!</h2>
        <p>Thank you for registering. Please verify your email by entering the code below on the verification page:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0; color: #1f2937;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire shortly. If you did not sign up for Chattix, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mail] Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.warn(`[Mail Error] Failed to send email to ${email}:`, error.message);
    console.warn(`[Mail Bypass] Verification code for ${email} is: ${code}`);
    return false;
  }
};

export const sendResetPasswordEmail = async (email, code) => {
  const mailOptions = {
    from: `"Chattix Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Chattix - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #06b6d4; text-align: center;">Reset Your Password</h2>
        <p>You requested a password reset. Please enter the following code to complete the process:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0; color: #1f2937;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">If you did not request a password reset, please secure your account.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mail] Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.warn(`[Mail Error] Failed to send reset email to ${email}:`, error.message);
    console.warn(`[Mail Bypass] Reset password code for ${email} is: ${code}`);
    return false;
  }
};
