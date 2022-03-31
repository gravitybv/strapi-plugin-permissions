"use strict";

const _ = require("lodash");
const fs = require("fs").promises;

class Permissions {
  async setup() {
    if (!strapi.isLoaded) {
      setTimeout(() => {
        this.setup();
      }, 200);
      return;
    }

    if (!strapi.config.permissions) {
      strapi.log.info("[Permissions] 🚀 Creating permissions file...");
      await this.createPermissionsFile();

      // Strapi is now auto restarting... if not, schedule a 'kill'
      setTimeout(() => {
        strapi.log.info(
          "[Permissions] 🚀 Created config/permissions.js. Please restart Strapi manually."
        );
        process.exit(1);
      }, 200);
    }

    strapi.log.info("[Permissions] 🚀 Setting up permissions...");

    let roles = await strapi
      .plugin("users-permissions")
      .service("role")
      .getRoles();

    // Add roles that are set in config but not in strapi
    for(const configRole of Object.keys(strapi.config.permissions)){
      if(roles.find((role) => role.type == configRole)) {
        continue
      }
      const roleToAdd = {name: _.upperFirst(configRole), description: strapi.config.permissions[configRole].description}
      await strapi.plugin("users-permissions").service("role").createRole(roleToAdd)
    }

    roles = await strapi
    .plugin("users-permissions")
    .service("role")
    .getRoles();

    for (let role of roles) {
      if (!role || role.id === null) {
        continue;
      }

      role = await strapi
        .plugin("users-permissions")
        .service("role")
        .getRole(role.id, []);

      // Disable all current permissions
      const existingPermissionKeys = Object.keys(role.permissions);
      for (const permissionKey of existingPermissionKeys) {
        const controllers = _.values(
          role.permissions[permissionKey].controllers
        );
        for (const controller of controllers) {
          const controllerKeys = Object.keys(controller);
          for (const controllerKey of controllerKeys) {
            _.set(controller, `${controllerKey}.enabled`, false);
          }
        }
      }

      const permissionConfig =
        _.get(strapi.config.permissions, role.type, null) || null;
      if (!permissionConfig) {
        continue;
      }

      const permissionKeys = Object.keys(permissionConfig.permissions);

      for (const permissionKey of permissionKeys) {
        const keyParts = permissionKey.split(".");
        const key = _.head(keyParts) || permissionKey;
        const moduleParts = permissionKey.split("::");
        const moduleName = _.last(moduleParts) || permissionKey;

        const targetControllers =
          _.get(role.permissions[key], "controllers", null) || null;
        if (!targetControllers) {
          strapi.log.error(
            `[Permissions] Controller '${key}' not found! Skipping...`
          );
          continue;
        }

        const controllers = [];
        if (keyParts.length > 1) {
          controllers.push(targetControllers[keyParts[1]]);
        } else if (_.has(targetControllers, moduleName)) {
          controllers.push(targetControllers[moduleName]);
        } else {
          controllers.push(targetControllers);
        }

        for (const controller of controllers) {
          for (const permission of permissionConfig.permissions[permissionKey]) {
            if (_.has(controller, permission)) {
              _.set(controller, `${permission}.enabled`, true);
            } else {
              strapi.log.error(
                `[Permissions] Permission '${permission}' not found for '${permissionKey}'. Skipping...`
              );
            }
          }
        }
      }

      await strapi
        .plugin("users-permissions")
        .service("role")
        .updateRole(role.id, role);
    }

    strapi.log.info("[Permissions] 🚀 All permissions set.");
  }

  async createPermissionsFile() {
    const targetFilename = `${strapi.dirs.config}/permissions.js`;

    try {
      await fs.stat(targetFilename);
    } catch (e) {
      if (e.code !== "ENOENT") {
        return;
      }

      await fs.copyFile(`${__dirname}/default-config.js`, targetFilename);
    }
  }
}

module.exports = Permissions;
