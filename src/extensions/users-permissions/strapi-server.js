'use strict';

const nodemailer = require('nodemailer');

// Create transporter (use your existing nodemailer config)
const transporter = nodemailer.createTransport({
  host: 'mail.marketdoctors.com.ng',
  port: 465,
  secure: true,
  auth: {
    user: 'tech@marketdoctors.com.ng',
    pass: 'Crested01.$'
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = (plugin) => {
  const sanitizeOutput = (user) => {
    const {
      password, resetPasswordToken, confirmationToken, ...sanitizedUser
    } = user; // be careful, you need to omit other private attributes yourself
    return sanitizedUser;
  };

  plugin.controllers.user.updateMe = async (ctx) => {
    // ... your updateMe logic
  };

  // Add the lifecycle hooks before returning the plugin
  plugin.bootstrap = ({ strapi }) => {
    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      async afterUpdate(event) {
        const { result } = event;
        
        // Check if confirmed status is true
        if (result.confirmed === true) {
          try {
            const mailOptions = {
              from: '"Market Doctors" <tech@marketdoctors.com.ng>',
              to: result.email,
              subject: 'Your Market Doctors Account Has Been Approved',
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

  plugin.controllers.user.find = async (ctx) => {
    // ... your find logic
  };

  return plugin;
}; 