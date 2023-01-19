export default {
  public: {
    description: "Default role given to unauthenticated user.",
    permissions: {
      "plugin::users-permissions.auth": [
        "callback",
        "connect",
        "emailConfirmation",
        "forgotPassword",
        "register",
        "resetPassword",
        "sendEmailConfirmation",
      ],
    },
  },
  authenticated: {
    description: "Default role given to authenticated user.",
    permissions: {
      "plugin::users-permissions.auth": ["callback", "connect"],
      "plugin::users-permissions.user": ["me"],
    },
  },
};
