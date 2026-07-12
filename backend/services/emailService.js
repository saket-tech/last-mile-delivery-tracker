const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error.message);
    // Don't throw error - email failure should not break the flow
  }
};

// Send order status email
const sendOrderStatusEmail = async (customerEmail, customerName, orderNumber, status, notes = '') => {
  const subject = `Order ${orderNumber} Status Update: ${status}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Status Update</h2>
      <p>Dear ${customerName},</p>
      <p>Your order <strong>${orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
      ${notes ? `<p><em>${notes}</em></p>` : ''}
      <p>You can track your order using the tracking number: ${orderNumber}</p>
      <p>Thank you for using our delivery service!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
    </div>
  `;
  
  await sendEmail(customerEmail, subject, html);
};

// Send failed delivery email
const sendFailedDeliveryEmail = async (customerEmail, customerName, orderNumber) => {
  const subject = `Delivery Failed for Order ${orderNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Delivery Attempt Failed</h2>
      <p>Dear ${customerName},</p>
      <p>We regret to inform you that the delivery attempt for order <strong>${orderNumber}</strong> was unsuccessful.</p>
      <p>Please log in to your account to reschedule the delivery at a convenient time.</p>
      <p>We apologize for the inconvenience and will ensure your package is delivered on the rescheduled date.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
    </div>
  `;
  
  await sendEmail(customerEmail, subject, html);
};

// Send rescheduled delivery email
const sendRescheduledEmail = async (customerEmail, customerName, orderNumber, newDate) => {
  const subject = `Order ${orderNumber} Rescheduled`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Delivery Rescheduled</h2>
      <p>Dear ${customerName},</p>
      <p>Your order <strong>${orderNumber}</strong> has been rescheduled for delivery on: <strong>${newDate}</strong></p>
      <p>A delivery agent will be assigned shortly. You will receive notifications at each step of the delivery process.</p>
      <p>Thank you for your patience!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
    </div>
  `;
  
  await sendEmail(customerEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendOrderStatusEmail,
  sendFailedDeliveryEmail,
  sendRescheduledEmail
};
