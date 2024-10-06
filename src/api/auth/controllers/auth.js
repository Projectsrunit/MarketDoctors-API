'use strict';

const { ApplicationError, ValidationError } = require('@strapi/utils').errors;
const axios = require('axios');

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

    // Create a new user with all fields, including optional ones
    const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
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
      },
    });

    try {
      const otpResponse = await axios.post('https://api.sendchamp.com/api/v1/verification/create', {
        meta_data: {},
        channel: 'email',
        sender: 'Market Doctor',
        token_type: 'numeric',
        token_length: 4,
        expiration_time: 10,
        customer_email_address: newUser.email
      }, {
        headers: {
          Authorization: `Bearer sendchamp_live_$2a$10$L4qwyCSHxA3J6rPJV1l4Bu.uIjF4.5R3HisqHnZnJHgAofZiswXhy`, // Replace with your Sendchamp API key
          'Content-Type': 'application/json'
        }
      });

      if (otpResponse.data.status !== 'success') {
        throw new ApplicationError('Failed to send OTP');
      }

      // Capture Sendchamp's response
      const sendchampResponse = otpResponse.data;

      // Manually sanitize the output by removing sensitive fields
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

      // Include Sendchamp's response in the return body
      return ctx.send({
        message: 'OTP sent successfully',
        user: sanitizedUser,
        sendchampResponse,  // Add Sendchamp response data
      });

    } catch (error) {
      console.error('Error sending OTP:', error.response ? error.response.data : error.message);
      throw new ApplicationError('Could not send OTP, please try again');
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
   // Method to Verify OTP
   async verifyOTP(ctx) {
    const { verification_reference, verification_code } = ctx.request.body;

    // Validate the required fields
    if (!verification_reference || !verification_code) {
      throw new ValidationError('Please provide both verification reference and code');
    }

    try {
      // Make the API call to verify the OTP
      const otpVerificationResponse = await axios.post(
        'https://api.sendchamp.com/api/v1/verification/confirm',
        {
          verification_reference: verification_reference,
          verification_code: verification_code
        },
        {
          headers: {
            Authorization: 'Bearer sendchamp_live_$2a$10$L4qwyCSHxA3J6rPJV1l4Bu.uIjF4.5R3HisqHnZnJHgAofZiswXhy', // Replace with your Sendchamp API key
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      // Check if the OTP verification was successful
      if (otpVerificationResponse.data.status === 'success') {
        return ctx.send({
          message: 'OTP verified successfully',
          data: otpVerificationResponse.data, // Sendchamp's response data
        });
      } else {
        // Handle failed verification
        throw new ApplicationError('OTP verification failed');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error.response ? error.response.data : error.message);
      throw new ApplicationError('Could not verify OTP, please try again');
    }
  },
};
