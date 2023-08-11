// This api sends an SMS
export default async function callback(req, res) {
  console.log("Success from Tesla! ", req.body);

  // grab the code
  const { code } = req.body;

  const dataToSend = {
    grant_type: "authorization_code",
    client_id: process.env.TESLA_CLIENT_ID,
    client_secret: process.env.TESLA_CLIENT_SECRET,
    code,
    redirect_uri: "https://zippy-seven.vercel.app/api/auth/callback",
    scope: "openid vehicle_device_data offline_access",
    audience: "https://fleet-api.prd.na.vn.cloud.tesla.com",
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Specify the content type of the request body
    },
    body: JSON.stringify(dataToSend), // Convert the data to JSON string
  };
  try {
    const response = await fetch(
      "https://auth.tesla.com/oauth2/v3/token",
      requestOptions
    );
    console.log("Starting code exchange");
    const json = await response.json();
    const { access_token } = json.body;
    return access_token;
  } catch (err) {
    console.error("Error in callback from Tesla", err);
    res.json({
      message: "Error in callback from Tesla",
      code: 500,
      stack: err,
    });
  }

  res.end();
}
