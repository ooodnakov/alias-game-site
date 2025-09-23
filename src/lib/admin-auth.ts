const ADMIN_TOKEN = process.env.DECK_ADMIN_TOKEN;

export function isModerationEnabled() {
  return Boolean(ADMIN_TOKEN);
}

export function requestHasAdminToken(headers: Headers) {
  if (!ADMIN_TOKEN) {
    return false;
  }

  const headerToken = headers.get("x-admin-token");
  if (headerToken && headerToken === ADMIN_TOKEN) {
    return true;
  }

  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    if (token === ADMIN_TOKEN) {
      return true;
    }
  }

  return false;
}
