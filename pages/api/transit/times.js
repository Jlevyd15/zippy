import cookie from "cookie";
import { Buffer } from "buffer";
import { FAUNA_SECRET_COOKIE } from "../../../utils/fauna-auth";

const getTransitTimetableAPI = (stopId, lineId) =>
  `https://api.511.org/transit/stoptimetable?api_key=${process.env.TRANSIT_API_KEY}&operatorref=SF&monitoringref=${stopId}&format=json&lineref=${lineId}`;

const fixInvalidUtf8 = (data) => {
  // This is a hacky fix because the 511 endpoint return invalid UTF-8 characters.
  // I needed to encode to latin1 which can return a the invalid character to something I can read and remove
  const encodeToLatin = Buffer.from(data, "latin1").toString("latin1");
  // after encoding to latin1 I can replace the invalid character.
  return encodeToLatin.replace("ÿ", "");
};

const getFormattedTimetableData = (data) => {
  try {
    const results = [];
    let lineId = "";
    const cleaned = fixInvalidUtf8(data);
    const dataToJson = JSON.parse(cleaned);
    const stopsTimeData =
      dataToJson?.["Siri"]["ServiceDelivery"]["StopTimetableDelivery"][
        "TimetabledStopVisit"
      ];
    // Grab the first two timetable entries only
    for (let i = 0; i < 2; i++) {
      const arrivalTime =
        stopsTimeData[i]?.["TargetedVehicleJourney"]?.["TargetedCall"]
          ?.AimedArrivalTime;
      const arrivalTimeInTwelveHourFormat = new Date(
        arrivalTime
      ).toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      lineId = stopsTimeData[i]?.["TargetedVehicleJourney"]?.["LineRef"];
      results.push(arrivalTimeInTwelveHourFormat);
    }

    return {
      lineId,
      times: results,
    };
  } catch (err) {
    console.log("err", err);
    return {};
  }
};

const getTimetableData = async (stopId, lineId) => {
  try {
    const response = await fetch(getTransitTimetableAPI(stopId, lineId));
    const raw = await response.text();
    return getFormattedTimetableData(raw);
  } catch (err) {
    return {
      error: err,
      message: "Error fetching transit timetable data, please try again.",
    };
  }
};

export default async function times(req, res) {
  const { APP_API_KEY } = process.env;
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const faunaSecret = cookies[FAUNA_SECRET_COOKIE];
  const ACTION_KEY = req.headers?.authorization?.split(" ")[1];
  const { stopId, lineIds } = req.query;
  const jsonLineIds = JSON.parse(lineIds);

  if (!faunaSecret || ACTION_KEY !== APP_API_KEY || !ACTION_KEY) {
    return res.status(401).send("Auth error");
  }

  if (!Array.isArray(jsonLineIds) || jsonLineIds.length < 1) {
    return res.status(401).send("lineIds must be an Array of lineIds");
  }
  console.log("in times API", jsonLineIds, stopId);

  Promise.all(
    jsonLineIds.map((lineId) => {
      console.log("lineId", lineId);
      try {
        return getTimetableData(stopId, lineId);
      } catch (err) {
        return {
          error: err,
          message: "Error fetching transit data, please try again.",
        };
      }
    })
  )
    .then((data) => {
      console.log("done!", data);
      return res.status(200).json({ data });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        message: "Error fetching transit data, please try again.",
      });
    });
}
