'use strict';

const { ApplicationError, ValidationError } = require('@strapi/utils').errors;

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
      awards: newUser.awards,
      gender: newUser.gender,
      home_address: newUser.home_address,
      nearest_bus_stop: newUser.nearest_bus_stop,
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
    };

    return ctx.send({
      jwt: token,
      user: sanitizedUser,
    });
  },
};
