'use strict';

const { ApplicationError, ValidationError } = require('@strapi/utils').errors;

module.exports = {
  // Custom Registration Method
  async register(ctx) {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      role, 
      confirmed, 
      years_of_experience, 
      facility, 
      specialisation, 
      availability, 
      languages, 
      awards 
    } = ctx.request.body;

    // Validate required fields
    if (
      !firstName || 
      !lastName || 
      !email || 
      !password || 
      !phone || 
      !dateOfBirth || 
      !role ||
      !years_of_experience || 
      !facility || 
      !specialisation || 
      !availability || 
      !languages || 
      !awards 
    ) {
      throw new ValidationError('Please provide all required fields');
    }

    const existingUser = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

    if (existingUser) {
      throw new ApplicationError('Email is already in use');
    }

    // Check if the phone number already exists
    const existingUserByPhone = await strapi.query('plugin::users-permissions.user').findOne({ where: { phone } });
    if (existingUserByPhone) {
      throw new ApplicationError('Phone number already exists');
    }

    // Check if the provided role ID exists
    const roleEntry = await strapi.query('plugin::users-permissions.role').findOne({ where: { id: role } });
    if (!roleEntry) {
      throw new ValidationError('Invalid role ID provided');
    }

    // Create a new user with additional fields
    const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        role: roleEntry.id, 
        confirmed,
        years_of_experience,
        facility,
        specialisation,
        availability, // Expecting this to be an object
        languages, // Expecting this to be an array
        awards // Expecting this to be an array of objects
      },
    });

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
      availability: newUser.availability,
      languages: newUser.languages,
      awards: newUser.awards
    };

    return ctx.send({
      user: sanitizedUser,
    });
  },

  // Custom Login Method (unchanged)
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
      confirmed:user.confirmed,
    };

    return ctx.send({
      jwt: token,
      user: sanitizedUser,
    });
  },
};
