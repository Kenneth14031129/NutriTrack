const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Configure email transporter (using Gmail as example)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendOTP(email, otp, userName = 'User') {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: {
          name: 'NutriTrack',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Verify Your NutriTrack Account - OTP Code',
        html: this.generateOTPTemplate(otp, userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  generateOTPTemplate(otp, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your NutriTrack Account</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            border-radius: 50%;
            margin-bottom: 20px;
          }
          .logo svg {
            width: 30px;
            height: 30px;
            color: white;
          }
          h1 {
            color: #1F2937;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #6B7280;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #10B981, #3B82F6);
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 4px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
          }
          .info-box {
            background: #F3F4F6;
            border-left: 4px solid #10B981;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <h1>Welcome to NutriTrack!</h1>
            <p class="subtitle">Please verify your email address to complete your registration</p>
          </div>

          <p>Hi ${userName},</p>

          <p>Thank you for signing up for NutriTrack! To complete your account verification, please use the following One-Time Password (OTP):</p>

          <div class="otp-box">
            ${otp}
          </div>

          <div class="info-box">
            <strong>Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This OTP is valid for <strong>10 minutes</strong> only</li>
              <li>Enter this code in the verification screen to activate your account</li>
              <li>Do not share this code with anyone</li>
              <li>You have <strong>3 attempts</strong> to enter the correct code</li>
            </ul>
          </div>

          <p>If you didn't create an account with NutriTrack, please ignore this email or contact our support team.</p>

          <div class="footer">
            <p>This is an automated message from NutriTrack.<br>
            Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} NutriTrack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: {
          name: 'NutriTrack',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Welcome to NutriTrack - Your Healthy Journey Begins Now! 🌱',
        html: this.generateWelcomeTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  generateWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NutriTrack</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            border-radius: 50%;
            margin-bottom: 20px;
          }
          h1 {
            color: #1F2937;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .feature {
            padding: 20px;
            border-radius: 8px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱</div>
            <h1>Welcome to NutriTrack, ${userName}!</h1>
            <p>Your account has been successfully verified. Let's start your healthy journey together!</p>
          </div>

          <p>Hi ${userName},</p>

          <p>Congratulations! Your NutriTrack account is now active and ready to help you achieve your health and fitness goals.</p>

          <div class="feature-grid">
            <div class="feature">
              <h3>🍽️ Meal Planning</h3>
              <p>Create personalized meal plans tailored to your dietary preferences and goals.</p>
            </div>
            <div class="feature">
              <h3>💪 Workout Tracking</h3>
              <p>Plan and track your workouts with our comprehensive fitness planner.</p>
            </div>
            <div class="feature">
              <h3>🤖 AI Coach</h3>
              <p>Get personalized advice and recommendations from your AI health companion.</p>
            </div>
            <div class="feature">
              <h3>📊 Progress Monitoring</h3>
              <p>Track your progress with detailed analytics and insights.</p>
            </div>
          </div>

          <p>Ready to get started? Log in to your account and begin exploring all the features NutriTrack has to offer!</p>

          <div class="footer">
            <p>Need help getting started? Visit our help center or contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} NutriTrack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: {
          name: 'NutriTrack',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Reset Your NutriTrack Password',
        html: this.generatePasswordResetTemplate(resetUrl, userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  generatePasswordResetTemplate(resetUrl, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your NutriTrack Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            border-radius: 50%;
            margin-bottom: 20px;
          }
          h1 {
            color: #1F2937;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .warning-box {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒</div>
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your NutriTrack password</p>
          </div>

          <p>Hi ${userName},</p>

          <p>Someone requested a password reset for your NutriTrack account. If this was you, click the button below to reset your password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="reset-button">Reset My Password</a>
          </div>

          <div class="warning-box">
            <strong>Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This reset link is valid for <strong>30 minutes</strong> only</li>
              <li>You can only use this link once</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will remain unchanged if you don't click the link</li>
            </ul>
          </div>

          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6B7280; font-size: 14px;">${resetUrl}</p>

          <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>

          <div class="footer">
            <p>This is an automated message from NutriTrack.<br>
            Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} NutriTrack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();