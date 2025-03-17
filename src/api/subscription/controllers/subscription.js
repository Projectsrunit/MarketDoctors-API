'use strict';

const https = require('https');

module.exports = {
  async checkSubscription(ctx) {
    const { id } = ctx.params;
    
    const subscription = await strapi.db.query('api::subscription.subscription').findOne({
      where: { user: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return { status: 'none' };
    }

    const now = new Date();
    const status = now < new Date(subscription.endDate) ? 'active' : 'expired';
    return { status, subscription };
  },

  async createTrial(ctx) {
    try {
      const { userId } = ctx.request.body;
      
      if (!userId) {
        return ctx.badRequest('User ID is required');
      }

      // Check if user already has an active trial
      const existingTrial = await strapi.db.query('api::subscription.subscription').findOne({
        where: { 
          user: userId,
          plan: 'trial',
          status: 'active'
        },
      });

      if (existingTrial) {
        return ctx.badRequest('User already has an active trial');
      }
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const subscription = await strapi.entityService.create('api::subscription.subscription', {
        data: {
          user: userId,
          startDate,
          endDate,
          plan: 'trial',
          amount: 0,
          status: 'active',
        },
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('Trial creation error:', error);
      return ctx.badRequest('Failed to create trial subscription: ' + error.message);
    }
  },

  async verifyPayment(ctx) {
    const { reference } = ctx.request.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      };

      const req = https.request(options, async (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', async () => {
          const response = JSON.parse(data);
          
          if (response.status && response.data.status === 'success') {
            // Create or update subscription
            const subscription = await strapi.entityService.create('api::subscription.subscription', {
              data: {
                user: ctx.state.user.id,
                startDate: new Date(),
                endDate: new Date().setMonth(response.data.metadata.plan === 'annual' ? 12 : 6),
                plan: response.data.metadata.plan,
                amount: response.data.amount / 100,
                status: 'active',
                paymentReference: reference,
              },
            });

            ctx.send({ success: true, subscription });
          } else {
            ctx.send({ success: false, message: 'Payment verification failed' });
          }
        });
      });

      req.on('error', (error) => {
        ctx.send({ success: false, message: error.message });
      });

      req.end();
    });
  },
};
