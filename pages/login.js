import { useState } from "react";
import Router from "next/router";
import Layout from "../components/layout";

const signin = async (email, password) => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  Router.push("/profile");
};

function Login() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    error: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setUserData({ ...userData, error: "" });

    const email = userData.email;
    const password = userData.password;

    try {
      await signin(email, password);
    } catch (error) {
      console.error(error);
      setUserData({ ...userData, error: error.message });
    }
  }

  const redirect_uri = "https://zippy-seven.vercel.app/api/auth/callback";
  const teslaAuthClientUrl = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${process.env.TESLA_CLIENT_ID}&state=test4Turo&scope=vehicle_device_data+vehicle_cmds+offline_access+user_data+vehicle_charging_cmds&redirect_uri=${redirect_uri}`;

  return (
    <Layout>
      <div className="login">
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            type="text"
            id="email"
            name="email"
            value={userData.email}
            onChange={(event) =>
              setUserData(
                Object.assign({}, userData, { email: event.target.value })
              )
            }
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={(event) =>
              setUserData(
                Object.assign({}, userData, { password: event.target.value })
              )
            }
          />

          <button type="submit">Login</button>

          <p>- OR -</p>
          <form action={teslaAuthClientUrl} method="get">
            <input type="hidden" name="response_type" value="code" />
            <input
              type="hidden"
              name="client_id"
              value="c3ad1f2bc85a-4a0d-a6ca-c8b6c7dee6e5"
            />
            <input type="hidden" name="state" value="test4Turo" />
            <input
              type="hidden"
              name="scope="
              value="vehicle_device_data+vehicle_cmds+offline_access+user_data+vehicle_charging_cmds"
            />
            <input type="hidden" name="redirect_uri" value={redirect_uri} />
            <button type="submit">Login with Tesla</button>
          </form>

          {userData.error && <p className="error">Error: {userData.error}</p>}
        </form>
      </div>
      <style jsx>{`
        .login {
          max-width: 340px;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        form {
          display: flex;
          flex-flow: column;
        }

        label {
          font-weight: 600;
        }

        input {
          padding: 8px;
          margin: 0.3rem 0 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .error {
          margin: 0.5rem 0 0;
          color: brown;
        }
      `}</style>
    </Layout>
  );
}

export default Login;
