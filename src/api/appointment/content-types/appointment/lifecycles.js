  module.exports = {
    async afterCreate(event) {
      const { result } = event
      const receiverId = result.receiver;

      // Check if the receiver is connected
      const client = strapi['clients'].get(receiverId);

      if (client && client.readyState === WebSocket.OPEN) {

        client.send(JSON.stringify({
          type: 'new_message',
          message: result,
        }));
      }
    },
    async afterUpdate(event) {
      const { result } = event;
      const { receiver, read_status, delivery_status, id } = result;

      const client = strapi['clients'].get(receiver);

      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'message_status_update',
          message_id: id,
          read_status,
          delivery_status,
        }));
      }
    },
  };
