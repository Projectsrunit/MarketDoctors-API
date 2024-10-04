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
  register({ strapi }) {},

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
  
          const unreadMessages = await strapi.db.query('api::message.message').findMany({
            where: {
              receiver: own_id,
              read_status: {
                $in: [false, null],
              },
            },
          });
          socket.emit('unread_messages', unreadMessages);
        }
      });
  
      socket.on('update_delivery_status', async (data) => {
        const { message_id } = data;
        await strapi.db.query('api::message.message').update({
          where: { id: message_id },
          data: { delivery_status: true },
        });
      });
  
      socket.on('update_read_status', async (data) => {
        const { message_id } = data;
        await strapi.db.query('api::message.message').update({
          where: { id: message_id },
          data: { read_status: true },
        });
      });
  
      socket.on('get_older_messages', async (data) => {
        const { own_id, other_id, oldest_message_date, page_size = 20 } = data;
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
        };
        const messages = await strapi.db.query('api::message.message').findMany(query);
        socket.emit('older_messages', messages);
      });
  
      socket.on('new_message', async (data) => {
        const { sender, receiver, text_body, document_url } = data;
        await strapi.db.query('api::message.message').create({
          data: {
            sender,
            receiver,
            text_body,
            document_url,
            delivery_status: false,
            read_status: false,
          },
        });
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

