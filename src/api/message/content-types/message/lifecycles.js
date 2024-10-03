
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const { receiver } = result;

    // console.log(`AfterCreate Hook: New message for receiver ${receiver.id}`);

    const receiverSocket = strapi['io'].connectedClients.get(receiver.id);

    if (receiverSocket) {
      // console.log(`Notifying receiver ${receiver.id} about new message`);
      receiverSocket.emit('new_message', result);
    } else {
      // console.log('No receiverSocket. This is the connectedClients:', [...strapi['io'].connectedClients.entries()]);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    const { id, receiver, read_status, delivery_status } = result;
    // console.log(`AfterUpdate Hook: Message ${id} updated`);

    // Access the socket from strapi['io'].connectedClients
    const receiverSocket = strapi['io'].connectedClients.get(receiver.id);

    if (receiverSocket) {
      if (read_status !== undefined) {
        // console.log(`Sending read status update for message ${id} to receiver ${receiver.id}`);
        receiverSocket.emit('read_status_updated', result);
      }

      if (delivery_status !== undefined) {
        // console.log(`Sending delivery status update for message ${id} to receiver ${receiver.id}`);
        receiverSocket.emit('delivery_status_updated', result);
      }
    } else {
      // console.log('No receiverSocket. This is the connectedClients:', [...strapi['io'].connectedClients.entries()]);
    }
  },

  async beforeCreate(event) {
    event.params.populate = true;
  },

  async beforeUpdate(event) {
    event.params.populate = true;
  }
};


