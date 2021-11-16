import twilio from "twilio";
import { query as q } from "faunadb";
import { serverClient } from "../../../utils/fauna-auth";

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

const getArrivalTimesPerLine = async (lines, stopId) => {
  try {
    const response = await fetch(
      `https://zippy-seven.vercel.app/api/transit/times?stopId=${stopId}&lineIds=${JSON.stringify(
        lines
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.APP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (err) {
    return {
      error: err,
      message: "Error fetching transit timetable data, please try again.",
    };
  }
};

const getFormattedMessageForArrivalTimes = (arrivalTimesPerLine) =>
  arrivalTimesPerLine?.reduce((msg, { lineId, times }) => {
    msg += `${lineId} - ${times.join(" ")} \n`;
    return msg;
  }, "");

// This should convert a user friendly stop name "Home", "Work" to stopId
// stopIds should be saved in the db
const getStopIdFromSavedName = (stopName) => {
  // TODO(@jlevyd15) this needs to be saved in the db per user, hard coding this for now
  const stopIdHome = 14756;
  const stopIdWork = 15684;
  if (stopName === "Home") {
    return stopIdHome;
  } else if (stopName === "Work") {
    return stopIdWork;
  }
  return;
};

// This api sends an SMS
export default async function receive(req, res) {
  console.log("Twilio webhook! ", req.body);
  // check that the number who sent the sms is a valid number in our system
  const { Body, From } = req.body;

  // go to fauna and query all user phoneNumbers and lines who have smsStatus "true"
  const usersData = await getUsersData();
  const usersPhoneAndLines = getUserPhoneAndLines(usersData);
  const parsedPhoneNumber = From.replace(/\s|\+1/g, "");

  // find a number that matches the one requesting data
  const userDataMatchingFromPhoneNumber = usersPhoneAndLines.find(
    ({ phoneNumber }) => phoneNumber === parsedPhoneNumber
  );

  const isFromPhoneNumberValid = userDataMatchingFromPhoneNumber?.phoneNumber;
  const userLines = userDataMatchingFromPhoneNumber?.lines;

  if (!From || !Body || !isFromPhoneNumberValid) {
    return res
      .status(400)
      .json({ message: "You must signup before you can make that request" });
  }

  if (userLines.length < 1) {
    return res
      .status(400)
      .json({ message: "Setup lines to monitor on your settings page first" });
  }

  const stopId = getStopIdFromSavedName(Body);
  if (!stopId) {
    return res.status(400).json({
      message:
        "Stop not recognized, setup stops to monitor on your settings page first",
    });
  }

  // fetch the times data for each line the user has saved
  let arrivalTimesPerLine;
  let formattedMessage;
  try {
    arrivalTimesPerLine = await getArrivalTimesPerLine(userLines, stopId);
    console.log("data from 511", arrivalTimesPerLine);
    if (!arrivalTimesPerLine || !arrivalTimesPerLine.data.length > 0) {
      throw new Error("Error fetching from times API");
    }
    formattedMessage = getFormattedMessageForArrivalTimes(
      arrivalTimesPerLine.data
    );
  } catch (err) {
    return res
      .status(500)
      .json({ error: err, message: "Error getting transit times" });
  }

  const {
    twiml: { MessagingResponse },
  } = twilio;
  const twiml = new MessagingResponse();
  twiml.message(formattedMessage);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
}
