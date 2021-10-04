# Strapi plugin - Permissions

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

## Installation

1. Install using `npm install strapi-plugin-permissions`

## Usage

The plugin will automatically create a file in the `config/` directory of your Strapi installation.
This file is named `config/permissions.js` and will contain default permissions upon first install.

The permissions in this file will automatically be set upon Strapi bootstrap.

### Naming

Please use the prefix `plugin::` to target a specific plugin. Use `api::` to target one of your own controllers.
When only specifying the prefix and entity name, without targeting a controller (e.g. `api::restaurant` or `plugin::users-permissions`), the plugin will set the permissions for all of the controllers in that entity.
To target a specific controller, please use: `api::restaurant.restaurant`, or `plugin::users-permissions.auth`.

## License

[MIT License](./LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@gravitybv/strapi-plugin-permissions/latest.svg
[npm-version-href]: https://npmjs.com/package/@gravitybv/strapi-plugin-permissions
[npm-downloads-src]: https://img.shields.io/npm/dt/@gravitybv/strapi-plugin-permissions.svg
[npm-downloads-href]: https://npmjs.com/package/@gravitybv/strapi-plugin-permissions
[license-src]: https://img.shields.io/npm/l/@gravitybv/strapi-plugin-permissions.svg
[license-href]: https://npmjs.com/package/@gravitybv/strapi-plugin-permissions
