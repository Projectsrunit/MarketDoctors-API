module.exports = {
    routes: [
      {
        method: "POST",
        path: "/file-forward",
        handler: "file-forward.pushFile",
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "POST",
        path: "/file-forward/image",
        handler: "file-forward.pushImage",
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "POST",
        path: "/file-forward/practicing_license",
        handler: "file-forward.pushCertificiate",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  