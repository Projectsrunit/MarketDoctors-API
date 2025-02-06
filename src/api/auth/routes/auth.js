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
      handler: 'auth.login', // Login doesn't require authentication
      config: {
        auth: false, // Login doesn't require authentication
      },
    },
    {
      method: 'POST',
      path: '/otp/verify', // New OTP verification endpoint
      handler: 'auth.verifyOTP', // Define the correct handler in your controller
      config: {
        auth: false, // OTP verification doesn't require authentication
      },
    },
    {
      method: 'PUT',
      path: '/auth/approve-user/:id',
      handler: 'auth.approveUser',
      config: {
        policies: ['admin::isAuthenticatedAdmin'], // Ensure only admins can approve
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/users/count-by-role',
      handler: 'auth.countByRole',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/notifications/send',
      handler: 'auth.sendNotification',
      config: {
         // Only admins can send notifications
         auth: false,
      },
    },
    {
      method: 'POST',
      path: '/notifications/send-individual',
      handler: 'auth.sendIndividualNotification',
      config: {
        auth: false,
      },
    }
  ],
};
