module.exports = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Film Director API",
      version: "1.0.0",
      description: "API for managing films and directors",
    },
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
    },
  },
  apis: [
    "./auth/*.js",
    "./director/*.js",
    "./film/*.js",
    "./main.js",  
],
}; 