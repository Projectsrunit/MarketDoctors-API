'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/notifications/update-player-id',
      handler: 'notification.updatePlayerId',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/notifications/send-to-user-type',
      handler: 'notification.sendToUserType',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/notifications/send-to-users',
      handler: 'notification.sendToUsers',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
}; 