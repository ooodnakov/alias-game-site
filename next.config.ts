import nextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = nextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
