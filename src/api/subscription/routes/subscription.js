'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/subscriptions/check/:id',
      handler: 'subscription.checkSubscription',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/subscriptions/trial',
      handler: 'subscription.createTrial',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/subscriptions/verify-payment',
      handler: 'subscription.verifyPayment',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
