'use strict';

module.exports = {
  routes: [
    // Basic CRUD routes
    {
      method: 'GET',
      path: '/casewithvisit',
      handler: 'casewithvisit.find',
    },
    {
      method: 'POST',
      path: '/casewithvisit',
      handler: 'casewithvisit.create',
    },
    {
      method: 'PUT',
      path: '/casewithvisit/:id',
      handler: 'casewithvisit.update',
    },
    // Custom routes
    {
      method: 'POST',
      path: '/casewithvisit/add',
      handler: 'casewithvisit.add',
    },
    {
      method: 'POST',
      path: '/casewithvisit/edit',
      handler: 'casewithvisit.edit',
    },
  ],
};
