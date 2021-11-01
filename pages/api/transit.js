import cookie from "cookie";
import { FAUNA_SECRET_COOKIE } from "../../utils/fauna-auth";

const TRANSIT_LINES_API = `https://api.511.org/transit/lines?api_key=${process.env.TRANSIT_API_KEY}&operator_id=SF&format=json`;

const getTransitData = async () => {
  try {
    const response = await fetch(TRANSIT_LINES_API);
    return await response.text();
  } catch (err) {
    return {
      error: err,
      message: "Error fetching transit data, please try again.",
    };
  }
};

export default async function transit(req, res) {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const faunaSecret = cookies[FAUNA_SECRET_COOKIE];

  if (!faunaSecret) {
    return res.status(401).send("Auth cookie missing.");
  }

  try {
    const data = await getTransitData();
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({
      error: err,
      message: "Error fetching transit data, please try again.",
    });
  }
}
