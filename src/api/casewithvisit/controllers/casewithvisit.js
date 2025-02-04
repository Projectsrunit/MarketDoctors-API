// @ts-nocheck
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * A set of functions called "actions" for `casewithvisit`
 */

module.exports = {
  // Find method
  async find(ctx) {
    try {
      const entities = await strapi.entityService.findMany('api::casewithvisit.casewithvisit', {
        ...ctx.query
      });
      return { data: entities };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  // Create method
  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const entity = await strapi.entityService.create('api::casewithvisit.casewithvisit', {
        data: {
          ...data,
          publishedAt: new Date()
        }
      });
      return { data: entity };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  // Add method for case and visit
  async add(ctx) {
    try {
      const { caseData, visitData } = ctx.request.body.data;

      const newCase = await strapi.entityService.create('api::case.case', {
        data: { 
          ...caseData,
          publishedAt: new Date()
        },
      });

      const newCaseVisit = await strapi.entityService.create('api::casevisit.casevisit', {
        data: {
          ...visitData,
          case: newCase.id,
          publishedAt: new Date()
        },
      });

      return {
        data: {
          message: 'Case and case visit successfully created',
          case: newCase,
          caseVisit: newCaseVisit,
        }
      };
    } catch (error) {
      ctx.throw(400, error);
    }
  },

  // Edit method for case visits
  async edit(ctx) {
    try {
      const { visitData } = ctx.request.body.data;
      
      const updatedCaseVisits = await Promise.all(
        Object.keys(visitData).map(async (visitId) => {
          return await strapi.entityService.update('api::casevisit.casevisit', visitId, {
            data: {
              ...visitData[visitId],
              publishedAt: new Date()
            },
          });
        })
      );

      return {
        data: {
          message: 'Case visit(s) successfully updated',
          caseVisits: updatedCaseVisits,
        }
      };
    } catch (error) {
      ctx.throw(400, error);
    }
  },

  // Update method
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      
      const entity = await strapi.entityService.update('api::casewithvisit.casewithvisit', id, {
        data: {
          ...data,
          publishedAt: new Date()
        }
      });
      
      return { data: entity };
    } catch (error) {
      ctx.throw(500, error);
    }
  }
};

