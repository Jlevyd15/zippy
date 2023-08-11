const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(express.json()); // Parse JSON data in request body

  // Custom API route for /auth/callback with POST request
  server.post("/auth/callback", async (req, res) => {
    // Handle your POST API logic here
    const requestData = req.body; // Access the data sent in the request body
    // grab the code
    const { code } = req.body;

    const dataToSend = {
      grant_type: "authorization_code",
      client_id: process.env.TESLA_CLIENT_ID,
      client_secret: process.env.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: "https://zippy-seven.vercel.app/auth/callback",
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

    res.json({ message: "Received callback", data: requestData });
    // res.end();
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
