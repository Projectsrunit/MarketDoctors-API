
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const { receiver, sender } = result;

    const receiverSocket = strapi['io'].connectedClients.get(receiver.id);

    if (receiverSocket) {
      console.log(`Notifying receiver ${receiver.id} about new message from sender ${sender.id}`);
      receiverSocket.emit('new_message', result);
    } else {
      // console.log('No receiverSocket. This is the connectedClients:', [...strapi['io'].connectedClients.entries()]);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    const { id, receiver, read_status, delivery_status, sender } = result;

    const receiverSocket = strapi['io'].connectedClients.get(sender.id);

    if (receiverSocket) {
      if (read_status == true) {
        console.log(`Sending read status update for message ${id} to original sender ${sender.id}`);
        receiverSocket.emit('read_status_updated', result);
      } else if (delivery_status == true) {
        console.log(`Sending delivery status update for message ${id} to original sender ${sender.id}`);
        receiverSocket.emit('delivery_status_updated', result);
      } else {
        console.log('neither read nor delivery were true')
      }
    } else {
      // console.log('No receiverSocket. This is the connectedClients:', [...strapi['io'].connectedClients.entries()]);
    }
  },

  async beforeCreate(event) {
    // console.log('beforecreate for message: params', event.params)
    event.params.populate = true;
  },

  async beforeUpdate(event) {
    // console.log('beforeupdate for message: params', event.params)
    event.params.populate = true;
  }
};


