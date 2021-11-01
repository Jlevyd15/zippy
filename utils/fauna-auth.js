import faunadb from "faunadb";
import cookie from "cookie";

export const FAUNA_SECRET_COOKIE = process.env.FAUNA_SECRET_COOKIE;
const FAUNA_CLIENT_DOMAIN = process.env.FAUNA_CLIENT_DOMAIN;

export const serverClient = new faunadb.Client({
  domain: FAUNA_CLIENT_DOMAIN,
  secret: process.env.FAUNA_SERVER_KEY,
});

// Used for any authed requests.
export const faunaClient = (secret) =>
  new faunadb.Client({
    domain: FAUNA_CLIENT_DOMAIN,
    secret,
  });

export const serializeFaunaCookie = (userSecret) => {
  const cookieSerialized = cookie.serialize(FAUNA_SECRET_COOKIE, userSecret, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 72576000,
    httpOnly: true,
    path: "/",
  });
  return cookieSerialized;
};
