const nodemailer = require('nodemailer');

// SMTP Configuration for Hostinger with fallback
const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'carexps@phaetonai.com',
    pass: process.env.HOSTINGER_EMAIL_PASSWORD || process.env.EMAIL_PASSWORD || null
  }
};

// Check if email credentials are configured
const hasValidCredentials = () => {
  const password = process.env.HOSTINGER_EMAIL_PASSWORD || process.env.EMAIL_PASSWORD;
  return password && password !== 'your-email-password' && password !== 'your-hostinger-email-password-here' && password.length > 0;
};

// Create reusable transporter
const createTransporter = () => {
  try {
    if (!hasValidCredentials()) {
      console.warn('⚠️ Email credentials not configured. Set HOSTINGER_EMAIL_PASSWORD environment variable.');
      return null;
    }
    const transporter = nodemailer.createTransporter(SMTP_CONFIG);
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

// Simple HTML test template
function getTestTemplate(recipient) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareXPS Email Test</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .success {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 15px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 15px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">🏥 CareXPS Healthcare CRM</h2>
            <p style="margin: 10px 0 0 0;">Email Test Notification</p>
        </div>
        <div class="content">
            <div class="success">
                <h3 style="margin: 0 0 10px 0; color: #16a34a;">✅ Test Email Successful!</h3>
                <p style="margin: 0;">This test email was sent to: <strong>${recipient}</strong></p>
                <p style="margin: 10px 0 0 0;">Your Azure Function email service is working correctly.</p>
            </div>
            <p><strong>Test Details:</strong></p>
            <ul>
                <li>Timestamp: ${new Date().toISOString()}</li>
                <li>SMTP Host: smtp.hostinger.com</li>
                <li>Sender: carexps@phaetonai.com</li>
                <li>Environment: Azure Functions</li>
            </ul>
        </div>
        <div class="footer">
            <p style="margin: 0;">CareXPS Healthcare CRM - Email Test Service</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Azure Function entry point
module.exports = async function (context, req) {
  context.log('📧 Azure Function: Test email request received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
    return;
  }

  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    // Log environment check for debugging
    context.log('📧 Test Email Environment check:', {
      nodeVersion: process.version,
      hasHostingerPassword: !!process.env.HOSTINGER_EMAIL_PASSWORD,
      hasEmailPassword: !!process.env.EMAIL_PASSWORD,
      hostingerPasswordLength: process.env.HOSTINGER_EMAIL_PASSWORD ? process.env.HOSTINGER_EMAIL_PASSWORD.length : 0,
      emailPasswordLength: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('EMAIL') || key.includes('HOSTINGER'))
    });

    // Check if credentials are configured
    if (!hasValidCredentials()) {
      context.log.error('❌ Email credentials not configured');
      context.res = {
        status: 503,
        headers: corsHeaders,
        body: {
          error: 'Email service unavailable',
          details: 'SMTP credentials not configured. Please set HOSTINGER_EMAIL_PASSWORD or EMAIL_PASSWORD environment variable in Azure Function settings.',
          debug: {
            hasHostingerPassword: !!process.env.HOSTINGER_EMAIL_PASSWORD,
            hasEmailPassword: !!process.env.EMAIL_PASSWORD,
            availableEnvKeys: Object.keys(process.env).filter(key => key.includes('EMAIL') || key.includes('HOSTINGER'))
          }
        }
      };
      return;
    }

    const { recipient } = req.body;

    // Validate recipient email
    if (!recipient) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'No recipient email provided' }
      };
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'Invalid email address format' }
      };
      return;
    }

    // Create transporter
    const emailTransporter = createTransporter();
    if (!emailTransporter) {
      context.res = {
        status: 503,
        headers: corsHeaders,
        body: {
          error: 'Failed to initialize email service',
          details: 'Could not create email transporter'
        }
      };
      return;
    }

    // Prepare test email
    const mailOptions = {
      from: {
        name: 'CareXPS Test Service',
        address: 'carexps@phaetonai.com'
      },
      to: recipient,
      subject: 'CareXPS Email Service Test - Success!',
      html: getTestTemplate(recipient),
      text: `CareXPS Email Service Test\n\nThis test email was sent to: ${recipient}\nTimestamp: ${new Date().toISOString()}\n\nYour Azure Function email service is working correctly!`
    };

    context.log(`📧 Sending test email to: ${recipient}`);

    // Send email
    const result = await emailTransporter.sendMail(mailOptions);

    context.log('✅ Test email sent successfully:', {
      messageId: result.messageId,
      recipient: recipient
    });

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        recipient: recipient,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    context.log.error('❌ Test email failed:', error);

    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to send test email',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};