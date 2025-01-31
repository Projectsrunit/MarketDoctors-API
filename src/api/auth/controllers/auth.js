// @ts-nocheck
'use strict';

const { ApplicationError, ValidationError } = require('@strapi/utils').errors;
const nodemailer = require('nodemailer');

// Create a transporter using Gmail (you can change this to your preferred email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arafats144@gmail.com', // Replace with your email
    pass: 'zvsg ntyl joaj ptxv' // Replace with your app password
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
        from: 'arafats144@gmail.com', // Replace with your email
        to: email,
        subject: 'Your Market Doctor Registration OTP',
        html: `
          <h1>Welcome to Market Doctor</h1>
          <p>Hello ${firstName},</p>
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

      return ctx.send({
        message: 'OTP sent successfully',
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
};
