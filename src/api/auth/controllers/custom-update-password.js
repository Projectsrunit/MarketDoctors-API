// @ts-nocheck
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const { parseMultipartData, sanitizeEntity } = require('@strapi/utils');
const bcrypt = require('bcrypt'); 

module.exports = {
   

    async updatePassword(ctx) {
        const { token, newPassword } = ctx.request.body;
    
        if (!token || !newPassword) {
            return ctx.badRequest('Token and new password are required');
        }
    
        try {
            // Verify the token
            const decoded = await strapi.plugin('users-permissions').services.jwt.verify(token);
            console.log("Decoded token:", decoded);
            
            // Find the user by ID
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { id: decoded.id }
            });
    
            console.log("User found:", user);
    
            if (!user) {
                return ctx.notFound('User not found');
            }
    
            // Hash the new password using bcrypt
            const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the salt rounds
    
            // Update the password
            await strapi.query('plugin::users-permissions.user').update({
                where: { id: user.id }, // Use 'where' to identify the user
                data: { password: hashedPassword } // Provide the data object
            });
    
            return ctx.send({ message: 'Password updated successfully' });
        } catch (err) {
            console.error('Error updating password:', err);
            return ctx.internalServerError('Unable to update password');
        }
    }
    
    
};
