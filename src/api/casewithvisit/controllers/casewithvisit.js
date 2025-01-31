'use strict';

/**
 * A set of functions called "actions" for `casewithvisit`
 */

module.exports = {
  add: async (ctx) => {
    try {
      const { caseData, visitData } = ctx.request.body.data;
      console.log('Inside case add. Data is', caseData, visitData);

      const newCase = await strapi.entityService.create('api::case.case', {
        data: { ...caseData },
      });

      const newCaseVisit = await strapi.entityService.create('api::casevisit.casevisit', {
        data: {
          ...visitData,
          case: newCase.id,
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
            data: visitData[visitId],
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

};

