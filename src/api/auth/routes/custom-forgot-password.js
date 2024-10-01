// Path: src/api/user/routes/custom-forgot-password.js
module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/auth/custom-forgot-password',
        handler: 'custom-forgot-password.forgotPassword',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  