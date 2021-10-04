'use strict';

module.exports = {
  public: {
    'plugin::users-permissions.auth': [
      'callback',
      'connect',
      'emailConfirmation',
      'forgotPassword',
      'register',
      'resetPassword',
      'sendEmailConfirmation'
    ]
  },
  authenticated: {
    'plugin::users-permissions.auth': ['callback', 'connect'],
    'plugin::users-permissions.user': ['me']
  }
};
