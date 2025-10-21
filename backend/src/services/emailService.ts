import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

// Create email transporter (using SendGrid)
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Email templates
const templates: Record<string, string> = {
  'email-verification': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to TechShop, {{name}}!</h2>
    <p>Thank you for creating an account with us. Please verify your email address to get started.</p>
    <p><a href="{{verificationLink}}" class="button">Verify Email Address</a></p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p>{{verificationLink}}</p>
    <div class="footer">
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
      <p>&copy; 2024 TechShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  'password-reset': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hi {{name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p><a href="{{resetLink}}" class="button">Reset Password</a></p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p>{{resetLink}}</p>
    <div class="footer">
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>&copy; 2024 TechShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  'order-confirmation': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .order-details { background-color: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Order Confirmation</h2>
    <p>Hi {{customerName}},</p>
    <p>Thank you for your order! We've received your order and will begin processing it soon.</p>

    <div class="order-details">
      <p><strong>Order Number:</strong> {{orderNumber}}</p>
      <p><strong>Order Date:</strong> {{orderDate}}</p>

      <h3>Items:</h3>
      {{#each items}}
      <div class="item">
        <span>{{this.name}} (x{{this.quantity}})</span>
        <span>${{this.subtotal}}</span>
      </div>
      {{/each}}

      <div class="total">
        <div style="display: flex; justify-content: space-between;">
          <span>Total:</span>
          <span>${{total}}</span>
        </div>
      </div>

      <h3>Shipping Address:</h3>
      <p>
        {{shippingAddress.fullName}}<br>
        {{shippingAddress.streetAddress}}<br>
        {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}
      </p>
    </div>

    <p>We'll send you another email when your order ships.</p>

    <div class="footer">
      <p>Questions? Contact us at {{supportEmail}}</p>
      <p>&copy; 2024 TechShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Get template
    const templateHtml = templates[options.template];
    if (!templateHtml) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Compile template
    const template = handlebars.compile(templateHtml);
    const html = template(options.context);

    // Send email
    await transporter.sendMail({
      from: `${process.env.FROM_NAME || 'TechShop'} <${process.env.FROM_EMAIL || 'noreply@techshop.com'}>`,
      to: options.to,
      subject: options.subject,
      html,
    });

    console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};
