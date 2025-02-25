// @ts-nocheck
'use strict';

const OneSignal = require('@onesignal/node-onesignal');

// TODO: Replace these with environment variables later
const ONESIGNAL_APP_ID = '69587fc7-f7c9-4119-acf4-c632d8646c01';  // Your OneSignal App ID
const ONESIGNAL_API_KEY = 'os_v2_app_nfmh7r7xzfartlhuyyznqzdmagengaelwetu37mz3kiisal2uvcoiajbtky4kq7ztwue6nu5ezpr3uwjqz2vnhvlgydpr4paxbqo5ci';

const configuration = OneSignal.createConfiguration({
  userKey: ONESIGNAL_API_KEY,
  appKey: ONESIGNAL_API_KEY
});

const client = new OneSignal.DefaultApi(configuration);

module.exports = {
  // Send notification to specific users by their player IDs
  async sendToUsers(playerIds, title, message, data = {}) {
    try {
      if (!playerIds || playerIds.length === 0) {
        console.log('No player IDs provided for push notification');
        return null;
      }

      const notification = {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        contents: { en: message },
        headings: { en: title },
        data: data
      };

      console.log('Sending notification:', JSON.stringify(notification));
      const response = await client.createNotification(notification);
      console.log('OneSignal Response:', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('OneSignal Error:', error);
      throw error;
    }
  },

  // Send notification to users by segment/role
  async sendToSegment(segment, title, message, data = {}) {
    try {
      const notification = {
        app_id: ONESIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: title },
        data: data,
        filters: [
          {"field": "tag", "key": "user_type", "relation": "=", "value": segment.toLowerCase()}
        ]
      };

      console.log('Sending segment notification:', JSON.stringify(notification));
      const response = await client.createNotification(notification);
      console.log('OneSignal Response:', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('OneSignal Error:', error);
      throw error;
    }
  },

  // Send notification to a specific user by email
  async sendToUserByEmail(email, title, message, data = {}) {
    try {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.onesignal_player_id) {
        console.log(`User ${email} has no OneSignal player ID`);
        return null;
      }

      return this.sendToUsers([user.onesignal_player_id], title, message, data);
    } catch (error) {
      console.error('OneSignal Error:', error);
      throw error;
    }
  },

  // Update user's OneSignal player ID
  async updatePlayerID(userId, playerId) {
    try {
      // First, check if this player ID is already assigned to another user
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { onesignal_player_id: playerId }
      });

      if (existingUser && existingUser.id !== userId) {
        // Remove the player ID from the old user
        await strapi.entityService.update('plugin::users-permissions.user', existingUser.id, {
          data: {
            onesignal_player_id: null
          }
        });
      }

      // Update the new user with the player ID
      const result = await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: {
          onesignal_player_id: playerId
        }
      });
      return result;
    } catch (error) {
      console.error('Error updating player ID:', error);
      throw error;
    }
  }
}; 