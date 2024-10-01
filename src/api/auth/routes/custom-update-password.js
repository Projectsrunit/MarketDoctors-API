module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/auth/custom-update-password',
        handler: 'custom-update-password.updatePassword',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
