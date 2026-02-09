"use strict";

const _ = require("lodash");
const fs = require("fs").promises;

const convertRoleNameToRoleType = (roleName) => {
  return _.snakeCase(_.deburr(_.toLower(roleName)));
};

class Permissions {
  async setup(retries = 0) {
    const MAX_RETRIES = 50; // Max 10 seconds (50 * 200ms)
    
    if (!strapi.isLoaded) {
      if (retries >= MAX_RETRIES) {
        strapi.log.error(
          `[Permissions] ❌ Timeout: Strapi not loaded after ${(MAX_RETRIES * 200) / 1000}s. Permissions not set!`
        );
        return;
      }
      
      // Wait 200ms and retry
      return new Promise((resolve) => {
        setTimeout(async () => {
          await this.setup(retries + 1);
          resolve();
        }, 200);
      });
    }
    
    strapi.log.info("[Permissions] 🔄 Starting permissions setup...");

    const pluginConfig = strapi.config.get("plugin.permissions");

    if (!strapi.config.permissions) {
      strapi.log.info("[Permissions] 🚀 Creating permissions file...");
      await this.createPermissionsFile(pluginConfig.typescript);

      // Strapi is now auto restarting... if not, schedule a 'kill'
      setTimeout(() => {
        strapi.log.info(
          `[Permissions] 🚀 Created config/permissions.${
            pluginConfig.typescript ? "ts" : "js"
          }. Please restart Strapi manually.`
        );
        process.exit(1);
      }, 200);
    }

    strapi.log.info("[Permissions] 🚀 Setting up permissions...");

    let roles = await strapi.service("plugin::users-permissions.role").find();

    // Add roles that are set in config but not in strapi
    for (const configRole of Object.keys(strapi.config.permissions)) {
      if (
        roles.find((role) => role.type == convertRoleNameToRoleType(configRole))
      ) {
        continue;
      }
      let description = _.upperFirst(configRole);
      if (strapi.config.permissions[configRole].description) {
        description = strapi.config.permissions[configRole].description;
      }
      const roleToAdd = {
        name: _.upperFirst(configRole),
        description: description,
      };
      await strapi
        .service("plugin::users-permissions.role")
        .createRole(roleToAdd);
    }

    roles = await strapi.service("plugin::users-permissions.role").find();

    for (let role of roles) {
      if (!role || role.id === null) {
        continue;
      }

      role = await strapi
        .service("plugin::users-permissions.role")
        .findOne(role.id, []);

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

      const configKey = Object.keys(strapi.config.permissions).find(
        (key) => convertRoleNameToRoleType(key) === role.type
      );
      const configRole = strapi.config.permissions?.[configKey];

      let permissionConfig;
      if (configRole?.permissions) {
        permissionConfig = configRole.permissions;
      } else {
        permissionConfig = configRole;
      }

      if (!permissionConfig) {
        continue;
      }

      const permissionKeys = Object.keys(permissionConfig);

      for (const permissionKey of permissionKeys) {
        const keyParts = permissionKey.split(".");
        const key = _.head(keyParts) || permissionKey;
        const moduleParts = permissionKey.split("::");
        const moduleName = _.last(moduleParts) || permissionKey;

        strapi.log.debug(`[Permissions] Processing key: ${permissionKey}`);
        strapi.log.debug(`[Permissions]   - keyParts: ${JSON.stringify(keyParts)}`);
        strapi.log.debug(`[Permissions]   - key: ${key}`);
        strapi.log.debug(`[Permissions]   - moduleName: ${moduleName}`);

        const targetControllers =
          _.get(role.permissions[key], "controllers", null) || null;
        if (!targetControllers) {
          strapi.log.error(
            `[Permissions] Controller '${key}' not found! Skipping...`
          );
          strapi.log.debug(
            `[Permissions]   Available keys in role.permissions: ${JSON.stringify(Object.keys(role.permissions))}`
          );
          continue;
        }

        strapi.log.debug(
          `[Permissions]   - Available controllers: ${JSON.stringify(Object.keys(targetControllers))}`
        );

        const controllers = [];
        if (keyParts.length > 1) {
          strapi.log.debug(`[Permissions]   - Using keyParts[1]: ${keyParts[1]}`);
          const controller = targetControllers[keyParts[1]];
          if (controller) {
            controllers.push(controller);
          } else {
            strapi.log.warn(
              `[Permissions]   - Controller '${keyParts[1]}' not found in targetControllers!`
            );
          }
        } else if (_.has(targetControllers, moduleName)) {
          strapi.log.debug(`[Permissions]   - Using moduleName: ${moduleName}`);
          controllers.push(targetControllers[moduleName]);
        } else {
          strapi.log.debug(`[Permissions]   - Using all controllers`);
          controllers.push(targetControllers);
        }

        for (const controller of controllers) {
          if (!controller) {
            strapi.log.warn(
              `[Permissions]   - Controller is null/undefined for '${permissionKey}', skipping...`
            );
            continue;
          }

          strapi.log.debug(
            `[Permissions]   - Controller actions: ${JSON.stringify(Object.keys(controller))}`
          );

          for (const permission of permissionConfig[permissionKey]) {
            if (_.has(controller, permission)) {
              _.set(controller, `${permission}.enabled`, true);
              strapi.log.info(
                `[Permissions]   ✅ Enabled '${permission}' for '${permissionKey}'`
              );
            } else {
              strapi.log.error(
                `[Permissions]   ❌ Permission '${permission}' not found for '${permissionKey}'. Available: ${JSON.stringify(Object.keys(controller))}`
              );
            }
          }
        }
      }

      await strapi
        .service("plugin::users-permissions.role")
        .updateRole(role.id, role);
    }

    strapi.log.info("[Permissions] 🚀 All permissions set!");
  }

  async createPermissionsFile(typescript = false) {
    const targetFilename = `${
      strapi.dirs.config || strapi.dirs.app.config
    }/permissions.${typescript ? "ts" : "js"}`;

    try {
      await fs.stat(targetFilename);
    } catch (e) {
      if (e.code !== "ENOENT") {
        return;
      }

      await fs.copyFile(
        `${__dirname}/default-config.${typescript ? "ts" : "js"}`,
        targetFilename
      );
    }
  }
}

module.exports = Permissions;
