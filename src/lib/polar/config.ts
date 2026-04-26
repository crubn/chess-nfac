export function getAppBaseUrl(): string {
  const b = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return b.replace(/\/$/, "");
}

export function getPolarServer(): "sandbox" | "production" {
  return (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";
}

/** Product / price id from the Polar dashboard (use sandbox keys with sandbox server) */
export function getPolarProProductId(): string {
  return process.env.POLAR_PRO_PRODUCT_ID || "00000000-0000-0000-0000-000000000000";
}
