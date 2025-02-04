module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/casewithvisit/edit',
      handler: 'casewithvisit.edit',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/casewithvisit/add',
      handler: 'casewithvisit.add',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};