const adminLoginsEnv = process.env.DECK_ADMIN_GITHUB_LOGINS ?? "";

const normalizedAdminLogins = adminLoginsEnv
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter((value) => value.length > 0);

export const adminLogins = new Set<string>(normalizedAdminLogins);

export function isModerationEnabled(): boolean {
  return adminLogins.size > 0;
}
