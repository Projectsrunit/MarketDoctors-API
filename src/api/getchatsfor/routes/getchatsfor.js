module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/getchatsfor',
     handler: 'getchatsfor.finder',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
