// Generates a 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Sends the OTP via SMS. Currently logs to console (dev mode).
// To go live, replace the body of this function with a real SMS provider call
// (Twilio, MSG91, Fast2SMS, etc.) using their SDK/API.
const sendOTP = async (phone, otp) => {
  // ---- DEV MODE ----
  console.log(`\n===== OTP SMS =====`);
  console.log(`To: ${phone}`);
  console.log(`Message: Your NewSonaEnterprises verification code is ${otp}. Valid for 10 minutes.`);
  console.log(`====================\n`);

  // ---- PRODUCTION EXAMPLE (uncomment and configure when ready) ----
  // Example using Twilio:
  //
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({
  //   body: `Your ElectroShop verification code is ${otp}. Valid for 10 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+91${phone}`
  // });

  return true;
};

module.exports = { generateOTP, sendOTP };