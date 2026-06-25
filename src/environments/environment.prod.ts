export const environment = {
  production: true,
  apiUrl: "http://localhost:5135",
  auth: {
    registerEndpoint: "/api/Identity/register",
    confirmEmailEndpoint: "/api/Identity/confirm-email",
    loginEndpoint: "/api/Identity/login",
    refreshEndpoint: "/api/Identity/RefreshToken",
    forgotPasswordEndpoint: "/api/Identity/forget-password",
    resetPasswordEndpoint: "/api/Identity/reset-password",
    logoutEndpoint: "/api/Identity/logout",
    logoutAllEndpoint: "/api/Identity/logout-all",
  },
};

