const WebSocket = require('ws');

module.exports = {
  async bootstrap() {
    const wss = new WebSocket.Server({ port: 1337 });
    console.log('now connected on port of websocket')
    strapi['wss'] = wss;
    strapi['clients'] = new Map();

    wss.on('connection', function connection(ws, req) {
      console.log('New client connected');

      ws.on('message', async function incoming(message) {
        console.log('Received message:', message);

        let data;

        try {
          data = JSON.parse(message.toString());
          console.log('Parsed data:', data);
        } catch (error) {
          console.error("Error parsing message:", error);
          return;
        }

        if (data.type === 'register') {
          const { own_id } = data;
          ws['own_id'] = own_id;
          strapi['clients'].set(own_id, ws);
          console.log(`Client registered: ${own_id}`);

          const unreadMessages = await strapi.db.query('api::message.message').findMany({
            where: {
              receiver: own_id,
              read_status: false,
            },
          });

          console.log(`Unread messages for ${own_id}:`, unreadMessages);

          ws.send(JSON.stringify({
            type: 'unread_messages',
            messages: unreadMessages,
          }));
        }

        else if (data.type === 'update_status') {
          const { message_id, status_type, value } = data;
          console.log(`Updating status for message_id ${message_id}: ${status_type} = ${value}`);

          await strapi.db.query('api::message.message').update({
            where: { id: message_id },
            data: { [status_type]: value },
          });
        }

        else if (data.type === 'fetch_messages') {
          const { other_user_id, createdAt } = data;
          console.log(`Fetching messages between ${data.own_id} and ${other_user_id}`);

          const messages = await strapi.db.query('api::message.message').findMany({
            where: {
              OR: [
                { sender: data.own_id, receiver: other_user_id },
                { sender: other_user_id, receiver: data.own_id },
              ],
              ...(createdAt && { createdAt: { $lt: createdAt } }),
            },
            orderBy: { createdAt: 'desc' },
            limit: 100,
          });

          console.log(`Fetched messages:`, messages);

          ws.send(JSON.stringify({
            type: 'messages',
            messages,
          }));
        }

        else if (data.type === 'new_message') {
          const { sender, receiver, text_body, document_url } = data;
          console.log(`Storing new message from ${sender} to ${receiver}`);

          const newMessage = await strapi.db.query('api::message.message').create({
            data: {
              sender,
              receiver,
              text_body,
              document_url,
              read_status: false,
              delivery_status: false,
            },
          });

          console.log('New message stored:', newMessage);

          ws.send(JSON.stringify({
            type: 'message_storage',
            message: 'stored to db',
          }));
        }
      });

      ws.on('close', function close() {
        if ('own_id' in ws) {
          console.log(`Client disconnected: ${ws.own_id}`);
          strapi['clients'].delete(ws.own_id);
        }
      });
    });
  },
};
