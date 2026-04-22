import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export const sendSmsOtp = async (phone) => {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error("Twilio Verify is not configured.");
  }

  return client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: phone,
      channel: "sms"
    });
};

export const checkSmsOtp = async (phone, code) => {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error("Twilio Verify is not configured.");
  }

  return client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: phone,
      code
    });
};