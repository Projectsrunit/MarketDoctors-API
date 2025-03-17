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
    try {
      const { reference, userId, plan } = ctx.request.body;
      console.log('Verifying payment:', { reference, userId, plan });

      if (!reference || !userId) {
        return { success: false, message: 'Reference and userId are required' };
      }

      // Hardcoded secret key for testing
      const secretKey = 'sk_test_8aec9a304d365b92c61ef69e725dc50835b821a8';
      console.log('Using secret key:', secretKey);

      const verificationResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.paystack.co',
          port: 443,
          path: `/transaction/verify/${reference}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          },
        };

        console.log('Making verification request with options:', {
          path: options.path,
          method: options.method,
          headers: options.headers
        });

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              console.log('Paystack verification response:', response);
              resolve(response);
            } catch (error) {
              console.error('Parse error:', error);
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          reject(error);
        });

        req.end();
      });

      if (verificationResult.status && verificationResult.data?.status === 'success') {
        const subscription = await strapi.entityService.create('api::subscription.subscription', {
          data: {
            user: userId,
            startDate: new Date(),
            endDate: new Date(Date.now() + (plan === 'annual' ? 31536000000 : 15768000000)),
            plan: plan,
            amount: verificationResult.data.amount / 100,
            status: 'active',
            paymentReference: reference,
            publishedAt: new Date(),
          },
        });

        return { success: true, subscription };
      } else {
        console.error('Payment verification failed:', verificationResult);
        return {
          success: false,
          message: 'Payment verification failed',
          details: verificationResult
        };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        message: 'Payment verification failed: ' + error.message
      };
    }
  },
};
