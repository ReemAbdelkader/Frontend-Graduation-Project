export const environment = {
  production: false,
  apiUrl: "http://localhost:5135",
  auth: {
    registerEndpoint: "/api/Identity/register",
    confirmEmailEndpoint: "/api/Identity/confirm-email",
    loginEndpoint: "/api/Identity/login",
    refreshEndpoint: "/api/Identity/RefreshToken",
  },
};
