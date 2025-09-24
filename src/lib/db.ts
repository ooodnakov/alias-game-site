import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

const NEXT_PHASE_ENV_KEY = "NEXT_PHASE" as const;
const PRODUCTION_BUILD_PHASE = "phase-production-build" as const;

const env = typeof process !== "undefined" ? process.env : undefined;
const isProductionBuildPhase = (env?.[NEXT_PHASE_ENV_KEY] ?? null) === PRODUCTION_BUILD_PHASE;

function getEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function createPool() {
  const databaseUrl = getEnv("DATABASE_URL");

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    const username = url.username ? decodeURIComponent(url.username) : undefined;
    const password = url.password ? decodeURIComponent(url.password) : undefined;

    return mysql.createPool({
      host: url.hostname,
      port: Number(url.port || "3306"),
      user: username ?? getEnv("DB_USER") ?? "alias",
      password: password ?? getEnv("DB_PASSWORD") ?? "alias",
      database: url.pathname.replace(/^\//, ""),
      waitForConnections: true,
      connectionLimit: Number(getEnv("DB_CONNECTION_LIMIT") ?? "10"),
      namedPlaceholders: true,
    });
  }

  const host = getEnv("DB_HOST") ?? "127.0.0.1";
  const port = Number(getEnv("DB_PORT") ?? "3306");
  const user = getEnv("DB_USER") ?? "alias";
  const password = getEnv("DB_PASSWORD") ?? "alias";
  const database = getEnv("DB_NAME") ?? "alias";
  const connectionLimit = Number(getEnv("DB_CONNECTION_LIMIT") ?? "10");

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    namedPlaceholders: true,
  });
}

export function getDatabasePool() {
  if (isProductionBuildPhase) {
    throw new Error("Database connections are not allowed during build phase");
  }

  if (!pool) {
    pool = createPool();
  }

  return pool;
}

export async function closeDatabasePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
