// @ts-nocheck
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * A set of functions called "actions" for `casewithvisit`
 */

module.exports = createCoreController('api::casewithvisit.casewithvisit', ({ strapi }) => ({
  async create(ctx) {
    try {
      // Get the data from the request body
      const { data } = ctx.request.body;

      // Add publishedAt date to automatically publish the entry
      const dataToCreate = {
        ...data,
        publishedAt: new Date()  // This will publish the entry immediately
      };

      // Create the entry with the modified data
      const response = await super.create({
        ...ctx,
        request: {
          ...ctx.request,
          body: { data: dataToCreate }
        }
      });

      return response;
    } catch (error) {
      console.error('Error creating case with visit:', error);
      ctx.throw(500, error);
    }
  },

  add: async (ctx) => {
    try {
      const { caseData, visitData } = ctx.request.body.data;
      console.log('Inside case add. Data is', caseData, visitData);

      const newCase = await strapi.entityService.create('api::case.case', {
        data: { 
          ...caseData,
          publishedAt: new Date() // Add this to publish case immediately
        },
      });

      const newCaseVisit = await strapi.entityService.create('api::casevisit.casevisit', {
        data: {
          ...visitData,
          case: newCase.id,
          publishedAt: new Date() // Add this to publish case visit immediately
        },
      });
      console.log('New case and visit created')

      ctx.body = {
        message: 'Case and case visit successfully created',
        case: newCase,
        caseVisit: newCaseVisit,
      };
    } catch (error) {
      ctx.status = 400;
      console.error(error);
      ctx.body = {
        message: 'An error occurred while creating case and case visit',
        error: error.message,
      };
    }
  },

  edit: async (ctx) => {
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

      ctx.body = {
        message: 'Case visit(s) successfully updated',
        caseVisits: updatedCaseVisits,
      };
    } catch (error) {
      ctx.status = 400;
      console.error(error);
      ctx.body = {
        message: 'An error occurred while updating case visit',
        error: error.message,
      };
    }
  },

  // Method to update and publish existing records
  async update(ctx) {
    try {
      const { data } = ctx.request.body;
      const dataToUpdate = {
        ...data,
        publishedAt: new Date()
      };

      const response = await super.update({
        ...ctx,
        request: {
          ...ctx.request,
          body: { data: dataToUpdate }
        }
      });

      return response;
    } catch (error) {
      console.error('Error updating case with visit:', error);
      ctx.throw(500, error);
    }
  }
}));

