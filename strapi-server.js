'use strict';

const Permissions = require('./permissions');

module.exports = {
  async bootstrap({ strapi }) {
    const permissions = new Permissions(strapi);
    permissions.setup();
  }
};
