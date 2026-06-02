function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  KEYCLOAK_ISSUER: required("KEYCLOAK_ISSUER"),
  KEYCLOAK_CLIENT_ID: required("KEYCLOAK_CLIENT_ID"),
  KEYCLOAK_REDIRECT_URI: required("KEYCLOAK_REDIRECT_URI"),
  KEYCLOAK_POST_LOGOUT_URI: process.env.KEYCLOAK_POST_LOGOUT_URI || "",
  DATABASE_URL: required("DATABASE_URL"),
  OPENCLAW_GATEWAY_URL: required("OPENCLAW_GATEWAY_URL"),
  OPENCLAW_GATEWAY_TOKEN: required("OPENCLAW_GATEWAY_TOKEN"),
  SESSION_SECRET: required("SESSION_SECRET"),
  APP_ORIGIN: process.env.APP_ORIGIN || "http://127.0.0.1:3003",
};
