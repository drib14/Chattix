import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    console.log('📧 Attempting to send email to:', options.email);

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Email configuration missing. Please configure EMAIL_USER and EMAIL_PASS in production environment variables.');
      } else {
        console.warn('⚠️ WARNING: EMAIL_USER or EMAIL_PASS environment variables are missing.');
        console.warn('⚠️ Server is running in development: mocking email transmission.');
        console.log(`📬 [MOCK EMAIL SENT] to: ${options.email}`);
        console.log(`📬 [MOCK EMAIL SUBJECT] subject: ${options.subject}`);
        return {
          success: true,
          mocked: true,
          messageId: 'mock-message-id-development'
        };
      }
    }

    console.log('📧 Using email account:', process.env.EMAIL_USER);

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify transporter configuration
    console.log('🔍 Verifying email transporter...');
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');

    // Email options
    const mailOptions = {
      from: `"CHATTIX" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    // Send email
    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('❌ Full error:', error);

    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed. Please check:');
      console.error('   1. EMAIL_USER is correct');
      console.error('   2. EMAIL_PASS is a Gmail App Password (not regular password)');
      console.error('   3. 2-Step Verification is enabled on your Gmail account');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ Connection failed. Please check your internet connection');
    }

    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default sendEmail;
