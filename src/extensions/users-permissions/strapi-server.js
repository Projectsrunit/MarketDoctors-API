// @ts-nocheck
'use strict';

const nodemailer = require('nodemailer');

// Create transporter using env variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = (plugin) => {
  // Keep the original plugin functionality
  const originalBootstrap = plugin.bootstrap;
  const originalRegister = plugin.register;

  plugin.bootstrap = async (params) => {
    // Call the original bootstrap if it exists
    if (originalBootstrap) {
      await originalBootstrap(params);
    }

    // Add our lifecycle hooks
    params.strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      async afterUpdate(event) {
        const { result } = event;
        
        if (result.confirmed === true) {
          try {
            const mailOptions = {
              from: `"Market Doctors" <${process.env.SMTP_USER}>`,
              to: result.email,
              subject: 'Your Market Doctor Account Has Been Approved',
              html: `
                <h1>Welcome to Market Doctor!</h1>
                <p>Dear ${result.firstName},</p>
                <p>Your account has been approved by our administrators. You can now log in to your account on the App and start using our services.</p>
                <a href="https://play.google.com/store/apps/details?id=com.market_doctor&hl=en" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                  Login Now
                </a>
                <p>If you have any questions, please don't hesitate to contact our support team on +234 906 522 6485</p>
                <p>Best regards,<br>The Market Doctors Team</p>
              `
            };

            await transporter.sendMail(mailOptions);
            console.log('User approval email sent successfully to:', result.email);
          } catch (error) {
            console.error('Error sending approval email:', error);
          }
        }
      }
    });
  };

  // Preserve the original register function
  plugin.register = ({ strapi }) => {
    if (originalRegister) {
      originalRegister({ strapi });
    }
  };

  return plugin;
}; 