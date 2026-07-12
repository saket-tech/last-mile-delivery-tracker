const twilio = require('twilio');

// Initialize Twilio client if credentials are available and valid
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.log('Twilio initialization failed, SMS will be logged to console');
  }
}

// Send SMS
const sendSMS = async (to, message) => {
  try {
    if (client && process.env.TWILIO_PHONE_NUMBER) {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      console.log(`SMS sent to ${to}`);
    } else {
      // Fallback: console log if Twilio not configured
      console.log(`[SMS Service - Not Configured] To: ${to}, Message: ${message}`);
      console.log('To enable SMS, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
    }
  } catch (error) {
    console.error('SMS error:', error.message);
    // Don't throw error - SMS failure should not break the flow
  }
};

// Send order status SMS
const sendOrderStatusSMS = async (phone, orderNumber, status) => {
  const message = `Your order ${orderNumber} status is now: ${status}. Track your delivery for real-time updates.`;
  await sendSMS(phone, message);
};

// Send failed delivery SMS
const sendFailedDeliverySMS = async (phone, orderNumber) => {
  const message = `Delivery attempt failed for order ${orderNumber}. Please log in to reschedule delivery.`;
  await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOrderStatusSMS,
  sendFailedDeliverySMS
};
