
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const { receiver, sender } = result;
    const receiverSocket = strapi['io'].connectedClients.get(receiver.id);
    // console.log('sending to socket of receiver', receiver.id)
    if (receiverSocket) {
      const resultobj = JSON.parse(JSON.stringify(result))
      resultobj.sender = sender.id
      resultobj.receiver = receiver.id
      if (resultobj.createdBy) delete resultobj.createdBy
      if(resultobj.updatedBy) delete resultobj.updatedBy
      receiverSocket.emit('new_message', resultobj);
    } else {
      // console.log('No receiverSocket. This is the connectedClients:', [...strapi['io'].connectedClients.entries()]);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    const { read_status, delivery_status, sender } = result;

    const receiverSocket = strapi['io'].connectedClients.get(sender.id);

    if (receiverSocket) {
      if (read_status == true) {
        const resultobj = JSON.parse(JSON.stringify(result))
        resultobj.sender = result.sender.id
        resultobj.receiver = result.receiver.id
        if (resultobj.createdBy) delete resultobj.createdBy
        if(resultobj.updatedBy) delete resultobj.updatedBy
        receiverSocket.emit('read_status_updated', resultobj);
      } else if (delivery_status == true) {
        const resultobj = JSON.parse(JSON.stringify(result))
        resultobj.sender = result.sender.id
        resultobj.receiver = result.receiver.id
        if (resultobj.createdBy) delete resultobj.createdBy
        if(resultobj.updatedBy) delete resultobj.updatedBy
        receiverSocket.emit('delivery_status_updated', resultobj);
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


