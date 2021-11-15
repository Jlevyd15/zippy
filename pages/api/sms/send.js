import twilio from "twilio";
import { query as q } from "faunadb";
import { serverClient } from "../../../utils/fauna-auth";

const sendSMS = async (toPhoneNumber, message) => {
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

const getUserPhoneAndLines = (collections) => {
  try {
    return collections.map(({ data: { lines, phoneNumber } }) => ({
      phoneNumber,
      lines,
    }));
  } catch (error) {
    return { error, message: "Error getting collection data" };
  }
};

const getUsersData = async () => {
  let usersData;
  try {
    // TODO - consider how to batch the user data
    usersData = await serverClient.query(
      q.Map(
        q.Paginate(q.Match(q.Index("users_by_status"), true), { size: 20 }),
        q.Lambda((x) => q.Get(x))
      )
    );
    return usersData.data;
  } catch (error) {
    return { error, message: "Error fetching user data" };
  }
};

export default async function send(req, res) {
  const { APP_API_KEY } = process.env;
  const ACTION_KEY = req.headers?.authorization?.split(" ")[1];

  if (req.method === "POST" && ACTION_KEY === APP_API_KEY && ACTION_KEY) {
    // go to fauna and query all user phoneNumbers and lines who have smsStatus "true"
    const usersData = await getUsersData();
    const usersPhoneAndLines = getUserPhoneAndLines(usersData);
    // TODO - pass usersPhoneAndLines and hit endpoint that gets the stop timings for each line the user is tracking

    // const toPhoneNumber = req.body.phoneNumber;

    // forEach(() => {
    //   // for each of these users call sendSms
    //   if (toPhoneNumber) {
    //     await sendSMS(toPhoneNumber);
    //     return res.status(200).send("SMS sent successfully!");
    //   }
    // });
    return res.status(400).send("You must pass a valid phone number");
  }

  return res.status(401).send("Auth key missing.");
}
