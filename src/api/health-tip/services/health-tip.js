'use strict';

/**
 * health-tip service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::health-tip.health-tip');
