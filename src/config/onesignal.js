module.exports = {
  appId: process.env.ONESIGNAL_APP_ID,
  apiKey: process.env.ONESIGNAL_API_KEY,
  // Role IDs for different user segments
  roleIds: {
    doctor: 3,
    chew: 4,
    patient: 5
  }
}; 