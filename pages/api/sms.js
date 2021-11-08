import twilio from "twilio";

const sendSMS = async (toPhoneNumber) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const client = new twilio(accountSid, authToken);

  await client.messages
    .create({
      body: "Hello from Node",
      to: toPhoneNumber,
      from: twilioPhoneNumber,
    })
    .then((message) => console.log(message.sid));
};

export default async function sms(req, res) {
  const { APP_API_KEY } = process.env;
  const ACTION_KEY = req.headers?.authorization?.split(" ")[1];

  if (req.method === "POST" && ACTION_KEY === APP_API_KEY && ACTION_KEY) {
    const toPhoneNumber = req.body.phoneNumber;

    // go to fauna and query all user phoneNumbers and lines who have smsStatus "true"
    // hit endpoint that gets the stop timings for each line the user is tracking
    // for each of these users call sendSms
    if (toPhoneNumber) {
      await sendSMS(toPhoneNumber);
      return res.status(200).send("SMS sent successfully!");
    }
    return res.status(400).send("You must pass a valid phone number");
  }

  return res.status(401).send("Auth key missing.");
}
