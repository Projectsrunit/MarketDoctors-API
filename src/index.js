'use strict';
const { Server } = require('socket.io');
const _ = require('lodash');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const io = new Server(strapi.server.httpServer, {
      transports: ['websocket', 'polling']
    });

    // Attach connectedClients map to strapi.io for global access
    strapi.io = io;
    strapi.io.connectedClients = new Map();

    io.on('connection', async (socket) => {
      console.log('A user connected');

      socket.on('authenticate', async (data) => {
        const { own_id } = data;
        if (own_id) {
          strapi.io.connectedClients.set(own_id, socket);

          try {
            const unreadMessages = await strapi.db.query('api::message.message').findMany({
              where: {
                receiver: own_id,
                read_status: {
                  $in: [false, null],
                },
              },
              populate: true
            });
            const messagesRefined = []
            unreadMessages.forEach(message => {
              message = JSON.parse(JSON.stringify(message))
              if (message.sender && message.sender.id) {
                message.sender = message.sender.id;
              }
              if (message.receiver && message.receiver.id) {
                message.receiver = message.receiver.id;
              }
              if (message.createdBy) delete message.createdBy
              if (message.updatedBy) delete message.updatedBy
              messagesRefined.push(message);
            });
            socket.emit('unread_messages', messagesRefined);
          } catch (error) {
            console.error(`Error fetching unread messages for user ${own_id}:`, error);
          }
        }
      });

      socket.on('update_delivery_status', async (data) => {
        const { message_id } = data;
        try {
          await strapi.db.query('api::message.message').update({
            where: { id: message_id },
            data: { delivery_status: true },
          });
        } catch (error) {
          console.error(`Error updating delivery status for message ${message_id}:`, error);
        }
      });

      socket.on('update_read_status', async (data) => {
        const { message_id } = data;
        try {
          await strapi.db.query('api::message.message').update({
            where: { id: message_id },
            data: { read_status: true },
          });
        } catch (error) {
          console.error(`Error updating read status for message ${message_id}:`, error);
        }
      });

      socket.on('get_older_messages', async (data) => {
        const { own_id, other_id, oldest_message_date, page_size = 20 } = data;
        try {
          const query = {
            where: {
              $or: [
                { sender: own_id, receiver: other_id },
                { sender: other_id, receiver: own_id },
              ],
              ...(oldest_message_date && { createdAt: { $lt: new Date(oldest_message_date) } }),
            },
            orderBy: { createdAt: 'desc' },
            limit: page_size,
            populate: true
          };
          const messages = await strapi.db.query('api::message.message').findMany(query);
          const messagesRefined = []
          messages.forEach(message => {
            message = JSON.parse(JSON.stringify(message))
            if (message.sender && message.sender.id) {
              message.sender = message.sender.id;
            }
            if (message.receiver && message.receiver.id) {
              message.receiver = message.receiver.id;
            }
            if (message.createdBy) delete message.createdBy
            if (message.updatedBy) delete message.updatedBy
            messagesRefined.push(message);
          })
          socket.emit('older_messages', messagesRefined);
        } catch (error) {
          console.error(`Error fetching older messages between user ${own_id} and ${other_id}:`, error);
        }
      });

      socket.on('new_message', async (data, callback) => {
        const { sender, receiver, text_body, document_url } = data;
        try {
          const newMessage = await strapi.db.query('api::message.message').create({
            data: {
              sender,
              receiver,
              text_body,
              document_url,
              delivery_status: false,
              read_status: false,
            },
          });

          const mes = JSON.parse(JSON.stringify(newMessage))
          if (newMessage.sender && newMessage.sender.id) {
            mes.sender = newMessage.sender.id;
          }
          if (newMessage.receiver && newMessage.receiver.id) {
            mes.receiver = newMessage.receiver.id;
          }
          if (mes.createdBy) delete mes.createdBy
          if (mes.updatedBy) delete mes.updatedBy

          if (callback) {
            callback({
              success: true,
              message: mes,
            });
          }
        } catch (error) {
          console.error(`Error creating new message from user ${sender} to user ${receiver}:`, error);

          if (callback) {
            callback({
              success: false,
              error: `Failed to create message from user ${sender} to user ${receiver}`,
            });
          }
        }
      });

      socket.on('disconnect', () => {
        const disconnectedUserId = [...strapi.io.connectedClients.entries()]
          .find(([_, s]) => s === socket)?.[0];
        if (disconnectedUserId) {
          strapi.io.connectedClients.delete(disconnectedUserId);
          console.log(`User ${disconnectedUserId} disconnected`);
        }
      });
    });

    strapi['io'] = io;
  }
};

