export const environment = {
  production: true,
  apiUrl: "http://localhost:5135",
  auth: {
    registerEndpoint: "/api/Identity/register",
    confirmEmailEndpoint: "/api/Identity/confirm-email",
    loginEndpoint: "/api/Identity/login",
    refreshEndpoint: "/api/Identity/RefreshToken",
  },
};

