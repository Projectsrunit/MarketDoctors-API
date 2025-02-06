// @ts-nocheck
'use strict';

const { ApplicationError, ValidationError } = require('@strapi/utils').errors;
const nodemailer = require('nodemailer');

// Create a transporter using cPanel SMTP
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
  },
  // Add these options for better debugging
  debug: true,
  logger: true,
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Function to generate OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = {
  // Custom Registration Method
  async register(ctx) {
    const { 
      firstName, lastName, email, password, phone, dateOfBirth, role, confirmed,
      years_of_experience, facility, specialisation, availability, languages, awards,
      gender, home_address, nearest_bus_stop
    } = ctx.request.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      throw new ValidationError('Please provide all required fields: firstName, lastName, email, password, and role');
    }

    // Check if email already exists
    const existingUser = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });
    if (existingUser) {
      throw new ApplicationError('Email is already in use');
    }

    // Check if phone number already exists (if provided)
    if (phone) {
      const existingUserByPhone = await strapi.query('plugin::users-permissions.user').findOne({ where: { phone } });
      if (existingUserByPhone) {
        throw new ApplicationError('Phone number already exists');
      }
    }

    // Check if the provided role ID exists
    const roleEntry = await strapi.query('plugin::users-permissions.role').findOne({ where: { id: role } });
    if (!roleEntry) {
      throw new ValidationError('Invalid role ID provided');
    }

    try {
      // Generate OTP
      const otp = generateOTP();

      // Create email content
      const mailOptions = {
        from: `"Market Doctors" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Market Doctor Registration OTP',
        html: `

          <h1>Welcome to Market Doctor</h1>
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Your OTP for registration is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      // Create a new user
      const userToCreate = {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        role: roleEntry.id,
        confirmed: confirmed || false,
        years_of_experience: years_of_experience || null,
        facility: facility || null,
        specialisation: specialisation || null,
        availability: availability || null,
        languages: languages || null,
        awards: awards || null,
        gender: gender || null,
        home_address: home_address || null,
        nearest_bus_stop: nearest_bus_stop || null,
        otp: otp, // Store the OTP with the user
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      };

      const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: userToCreate,
      });

      // Manually sanitize the output
      const sanitizedUser = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        dateOfBirth: newUser.dateOfBirth,
        phone: newUser.phone,
        confirmed: newUser.confirmed,
        years_of_experience: newUser.years_of_experience,
        facility: newUser.facility,
        specialisation: newUser.specialisation,
        languages: newUser.languages,
        awards: newUser.awards,
        gender: newUser.gender,
        home_address: newUser.home_address,
        nearest_bus_stop: newUser.nearest_bus_stop,
      };

      // After creating the user, notify admin
      try {
        await this.notifyAdmin(newUser);
        console.log('Admin notification sent');
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Continue with registration even if notification fails
      }

      return ctx.send({
        message: 'User registered successfully. Waiting for admin approval.',
        user: sanitizedUser
      });

    } catch (error) {
      console.error('Error in registration process:', error);
      throw new ApplicationError('Could not complete registration, please try again');
    }
  },

  // Verify OTP Method
  async verifyOTP(ctx) {
    const { email, otp } = ctx.request.body;

    if (!email || !otp) {
      throw new ValidationError('Please provide both email and OTP');
    }

    try {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        throw new ApplicationError('User not found');
      }

      if (user.otp !== otp) {
        throw new ApplicationError('Invalid OTP');
      }

      if (new Date() > new Date(user.otpExpiry)) {
        throw new ApplicationError('OTP has expired');
      }

      // Update user to confirmed status
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          otp: null,
          otpExpiry: null
        }
      });

      return ctx.send({
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Error in OTP verification:', error);
      throw new ApplicationError(error.message || 'Could not verify OTP');
    }
  },

  // Custom Login Method
  async login(ctx) {
    const { email, password, role } = ctx.request.body;

    if (!email || !password || !role) {
        throw new ValidationError('Please provide email, password, and role');
    }

    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email }, populate: ['role'] });

    if (!user) {
      throw new ApplicationError('User not found');
    }

    // Check if the password is correct
    const validPassword = await strapi.service('plugin::users-permissions.user').validatePassword(password, user.password);

    if (!validPassword) {
      throw new ApplicationError('Invalid password');
    }

    // Check if the role matches
    if (user.role && user.role.id !== role) {
      throw new ApplicationError('Role does not match');
    }

    // Generate a JWT token
    const token = strapi.service('plugin::users-permissions.jwt').issue({ id: user.id });

    const sanitizedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      confirmed: user.confirmed,
    };

    return ctx.send({
      jwt: token,
      user: sanitizedUser,
    });
  },

  // Find All Users by Role
  async findAllByRole(ctx) {
    const { roleId } = ctx.query;

    if (!roleId) {
      throw new ValidationError('Please provide a roleId');
    }

    // Validate that roleId is a number
    if (isNaN(Number(roleId))) {
      throw new ValidationError('Invalid roleId provided');
    }

    // Find users with the specified role ID
    const users = await strapi.query('plugin::users-permissions.user').findMany({
      where: {
        role: roleId,
      },
    });

    return ctx.send({
      users,
    });
  },

  // Find One User by Role and ID
  async findOneByRoleAndId(ctx) {
    const { roleId, id } = ctx.query;

    if (!roleId || !id) {
      throw new ValidationError('Please provide both roleId and id');
    }

    // Validate that roleId and id are numbers
    if (isNaN(Number(roleId)) || isNaN(Number(id))) {
      throw new ValidationError('Invalid roleId or id provided');
    }

    // Find the user with the specified role ID and user ID
    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: {
        id,
        role: roleId,
      },
    });

    if (!user) {
      throw new ApplicationError('User not found');
    }

    return ctx.send({
      user,
    });
  },

  // Send email to admin when new user registers
  async notifyAdmin(user) {
    try {
      const fullUserData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
        populate: ['role']
      });

      const mailOptions = {
        from: `"Market Doctors" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: 'New User Registration Requires Approval',
        html: `
          <h1>New User Registration</h1>
          <p>A new user has registered and requires approval:</p>
          <ul>
            <li><strong>Name:</strong> ${fullUserData.firstName} ${fullUserData.lastName}</li>
            <li><strong>Email:</strong> ${fullUserData.email}</li>
            <li><strong>Role:</strong> ${fullUserData.role ? fullUserData.role.name : 'Not specified'}</li>
            <li><strong>Phone:</strong> ${fullUserData.phone || 'Not provided'}</li>
          </ul>
          <p>Please login to the admin panel to approve or reject this user.</p>
          <a href="https://walrus-app-ve54y.ondigitalocean.app" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Go to Admin Panel
          </a>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Admin notification email sent successfully:', result);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      if (error.response) {
        console.error('SMTP Response:', error.response);
      }
    }
  },

  // Send approval email to user
  async sendApprovalEmail(user) {
    try {
      const mailOptions = {
        from: `"Market Doctors" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Your Market Doctors Account Has Been Approved',
        html: `
          <h1>Welcome to Market Doctor!</h1>
          <p>Dear ${user.firstName},</p>
          <p>Your account has been approved by our administrators. You can now log in to your account on the App and start using our services.</p>
          <a href="https://play.google.com/store/apps/details?id=com.market_doctor&hl=en" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Login Now
          </a>
          <p>If you have any questions, please don't hesitate to contact our support team on +234 906 522 6485</p>
          <p>Best regards,<br>The Market Doctors Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('User approval email sent successfully');
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
  },

  // Add new endpoint for admin to approve users
  async approveUser(ctx) {
    try {
      const { id } = ctx.params;

      // Update user status
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          confirmed: true,
          blocked: false
        }
      });

      // Send approval email to user
      await this.sendApprovalEmail(updatedUser);

      return ctx.send({
        message: 'User approved successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error approving user:', error);
      ctx.throw(400, error);
    }
  },

  // Count users by role
  async countByRole(ctx) {
    try {
      // Get all users with their roles
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        populate: ['role']
      });

      // Initialize counters
      const counts = {
        doctors: 0,
        chews: 0,
        patients: 0
      };

      // Count users by role
      users.forEach(user => {
        if (user.role) {
          switch (user.role.id) {
            case 3: // Doctor role ID
              counts.doctors++;
              break;
            case 4: // CHEW role ID
              counts.chews++;
              break;
            case 5: // Patient role ID
              counts.patients++;
              break;
          }
        }
      });

      return ctx.send(counts);
    } catch (error) {
      console.error('Error counting users by role:', error);
      return ctx.throw(500, 'Failed to count users by role');
    }
  },

  // Send notifications to user groups
  async sendNotification(ctx) {
    try {
      const { segment, title, message } = ctx.request.body;

      if (!segment || !title || !message) {
        return ctx.badRequest('Missing required fields');
      }

      // Get role ID based on segment
      let roleId;
      switch (segment) {
        case 'doctor':
          roleId = 3;
          break;
        case 'chew':
          roleId = 4;
          break;
        case 'patient':
          roleId = 5;
          break;
        default:
          return ctx.badRequest('Invalid segment');
      }

      // Get all users in the specified role
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: {
          role: roleId
        }
      });

      if (!users || users.length === 0) {
        return ctx.badRequest(`No users found in the ${segment} group`);
      }

      console.log(`Found ${users.length} users in ${segment} group`);

      // Send email to each user in the group
      const emailPromises = users.map(user => {
        const mailOptions = {
          from: `"Market Doctors" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: title,
          html: `
            <h1>${title}</h1>
            <p>Dear ${user.firstName},</p>
            <p>${message}</p>
            <p>Best regards,<br>The Market Doctor Team</p>
          `
        };

        return transporter.sendMail(mailOptions)
          .catch(error => {
            console.error(`Failed to send email to ${user.email}:`, error);
            return null; // Continue with other emails even if one fails
          });
      });

      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      const successfulSends = results.filter(result => result !== null).length;

      // Save notification to database
      try {
        await strapi.entityService.create('api::notification.notification', {
          data: {
            title,
            message,
            segment,
            sent_at: new Date(),
            publishedAt: new Date()
          }
        });
      } catch (dbError) {
        console.error('Failed to save notification to database:', dbError);
        // Continue even if database save fails
      }

      return ctx.send({
        success: true,
        message: `Notification sent successfully to ${successfulSends} out of ${users.length} ${segment}(s)`,
        recipients: {
          total: users.length,
          successful: successfulSends,
          failed: users.length - successfulSends
        }
      });

    } catch (error) {
      console.error('Error in sendNotification:', error);
      return ctx.throw(500, {
        message: 'Failed to send notification',
        details: error.message
      });
    }
  }
};
