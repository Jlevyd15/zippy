import { query as q } from "faunadb";
import cookie from "cookie";
import { faunaClient, FAUNA_SECRET_COOKIE } from "../../utils/fauna-auth";

const getUserData = async (faunaSecret, userId) => {
  let userData;
  try {
    userData = await faunaClient(faunaSecret).query(
      q.Get(q.Ref(q.Collection("User"), userId))
    );
    return userData?.data;
  } catch (error) {
    return { error, message: "Error fetching user email" };
  }
};

const setUserData = async (faunaSecret, data) => {
  // make sure id is correct here
  const { id, ...restData } = data;
  try {
    await faunaClient(faunaSecret).query(
      q.Update(q.Ref(q.Collection("User"), id), { data: { ...restData } })
    );
  } catch (error) {
    return { error, message: "Error updating user profile" };
  }
};

export const profileApi = async (faunaSecret) => {
  try {
    const ref = await faunaClient(faunaSecret).query(q.CurrentIdentity());
    const userId = ref.id;
    const data = await getUserData(faunaSecret, userId);
    return { ...data, userId };
  } catch (error) {
    return {
      error,
      message: "Error getting profile information, please try again later.",
    };
  }
};

export default async function profile(req, res) {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const faunaSecret = cookies[FAUNA_SECRET_COOKIE];

  if (!faunaSecret) {
    return res.status(401).send("Auth cookie missing.");
  }

  // handle when the user posts profile updates
  if (req.method === "POST") {
    const { id, lines, phoneNumber, smsStatus } = await req.body;
    // TODO - validate the data
    // collect the data the user provided and save to the db
    // return the update profile info
    await setUserData(faunaSecret, { id, lines, phoneNumber, smsStatus });
  }

  res.status(200).json({ data: await profileApi(faunaSecret) });
}
