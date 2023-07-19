'use strict';

const Permissions = require('./permissions');

module.exports = {
  async bootstrap({ strapi }) {
    // Disable permission setting when dumping or restoring configuration, or executing any other command.
    if (!['start', 'develop'].includes(process.argv?.[2])) {
      return;
    }
    
    const permissions = new Permissions(strapi);
    permissions.setup();
  }
};
