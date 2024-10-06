// Path: src/api/user/controllers/custom-forgot-password.js
// @ts-ignore
// @ts-ignore
const { sanitizeEntity } = require('@strapi/utils');

module.exports = {
  async forgotPassword(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      // @ts-ignore
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      // Generate reset password token
      // @ts-ignore
      const resetToken = await strapi.plugin('users-permissions').services.jwt.issue({ id: user.id });

      // Create the reset password link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // Send reset password email (you should have your email provider configured in Strapi)
      // @ts-ignore
      await strapi.plugin('email').services.email.send({
        to: user.email,
        subject: 'Reset Password',
        // Here, use HTML content instead of plain text for a clickable link
        html: `<p>Please use the following link to reset your password:</p>
               <a href="${resetLink}">Reset Password</a>`
      });

      return ctx.send({ message: 'Password reset email sent' });
    } catch (err) {
      console.error('Error during password reset:', err);
      return ctx.internalServerError('Unable to send reset email');
    }
  },
};
