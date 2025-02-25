'use strict';

module.exports = {
  async updatePlayerId(ctx) {
    try {
      const { userId, playerId } = ctx.request.body;
      
      if (!userId || !playerId) {
        return ctx.badRequest('userId and playerId are required');
      }

      const result = await strapi.service('api::notification.onesignal').updatePlayerID(userId, playerId);
      return ctx.send(result);
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },

  async sendToUserType(ctx) {
    try {
      const { userType, title, message, data } = ctx.request.body;
      
      if (!userType || !title || !message) {
        return ctx.badRequest('userType, title, and message are required');
      }

      const result = await strapi.service('api::notification.onesignal').sendToSegment(userType, title, message, data || {});
      return ctx.send(result);
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },

  async sendToUsers(ctx) {
    try {
      const { playerIds, title, message, data } = ctx.request.body;
      
      if (!playerIds || !title || !message) {
        return ctx.badRequest('playerIds, title, and message are required');
      }

      const result = await strapi.service('api::notification.onesignal').sendToUsers(playerIds, title, message, data || {});
      return ctx.send(result);
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}; 