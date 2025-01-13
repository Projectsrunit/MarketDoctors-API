'use strict';

module.exports = {
  finder: async (ctx, next) => {
    try {
      const own_id = ctx.request.body.id;
      const role = ctx.request.body.role
      const asSender = await strapi.db.query('api::message.message').findMany({
        where: { sender: own_id },
        populate: true,
      });

      const asReceiver = await strapi.db.query('api::message.message').findMany({
        where: { receiver: own_id },
        populate: true,
      });

      const uniqueUserIds = new Set();
      asSender.forEach(message => {
        uniqueUserIds.add(message.receiver?.id);
      });
    
      asReceiver.forEach(message => {
        uniqueUserIds.add(message.sender?.id);
      });
      const userIdsArray = Array.from(uniqueUserIds).filter(id => id != null);
      const usersData = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { id: { $in: userIdsArray }, role: role },
        populate: true,
      });

      usersData.forEach(el => {
        if (el.password) delete el.password;
      });
            
      ctx.body = usersData;
    } catch (error) {
      ctx.status = 400
      ctx.body = {error};
    }    
  }
};
