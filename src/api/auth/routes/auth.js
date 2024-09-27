'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/register',
      handler: 'auth.register',
      config: {
        auth: false, // Registration doesn't require authentication
      },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'auth.login', // Correct handler name
      config: {
        auth: false, // Login doesn't require authentication
      },
    },
    // {
    //   method: 'POST',
    //   path: '/auth/verify-otp',
    //   handler: 'auth.verifyOtp', // Add the verify OTP handler
    //   config: {
    //     auth: false, // OTP verification doesn't require authentication
    //   },
    // },
  ],
};
