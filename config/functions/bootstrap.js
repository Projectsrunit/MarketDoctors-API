const _ = require('lodash');
const { Server } = require('socket.io');

module.exports = async () => {
  const io = new Server(strapi.server.httpServer);
  
  // Store connected clients
  const connectedClients = new Map();

  io.on('connection', async (socket) => {
    console.log('A user connected');

    // Handle client connection with own_id
    socket.on('authenticate', async (data) => {
      const { own_id } = data;
      if (own_id) {
        connectedClients.set(own_id, socket);
        console.log(`User ${own_id} authenticated`);

        // Send unread messages to the client
        const unreadMessages = await strapi.db.query('api::message.message').findMany({
          where: {
            receiver: own_id,
            read_status: false,
          },
        });
        socket.emit('unread_messages', unreadMessages);
      }
    });

    // Handle message delivery status update
    socket.on('update_delivery_status', async (data) => {
      const { message_id } = data;
      await strapi.db.query('api::message.message').update({
        where: { id: message_id },
        data: { delivery_status: true },
      });
    });

    // Handle message read status update
    socket.on('update_read_status', async (data) => {
      const { message_id } = data;
      await strapi.db.query('api::message.message').update({
        where: { id: message_id },
        data: { read_status: true },
      });
    });

    // Handle request for older messages
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

    // Handle new message
    socket.on('new_message', async (data) => {
      const { sender, receiver, text_body, document_url } = data;
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
      // Notify the receiver if they are connected
      const receiverSocket = connectedClients.get(receiver);
      if (receiverSocket) {
        receiverSocket.emit('new_message', newMessage);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const disconnectedUserId = [...connectedClients.entries()]
        .find(([_, s]) => s === socket)?.[0];
      if (disconnectedUserId) {
        connectedClients.delete(disconnectedUserId);
        console.log(`User ${disconnectedUserId} disconnected`);
      }
    });
  });

  strapi['io'] = io;
};