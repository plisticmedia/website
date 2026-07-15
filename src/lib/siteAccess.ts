export const SITE_ACCESS_COOKIE = "plistic_site_access";
export const SITE_ACCESS_COOKIE_VALUE = "fded09ba22fda31a3798426f110580489d2ebb95ebc6b4666465788d4c2d653a";

// Coming-soon / beta access password (SHA-256). Current password: "plisticbeta".
export const SITE_ACCESS_PASSWORD_HASH =
  "1bafaf02be1618d4170e193fbd6bf4c3558f3e142df2c31373725ce400c61cdb";

export async function hashSiteAccessPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySiteAccessPassword(password: string) {
  const passwordHash = await hashSiteAccessPassword(password);

  return constantTimeEqual(passwordHash, SITE_ACCESS_PASSWORD_HASH);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}
