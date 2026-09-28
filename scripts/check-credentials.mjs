const required = ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is missing from GitHub Actions secrets`);
}
const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(process.env.VERCEL_PROJECT_ID)}`);
url.searchParams.set("teamId", process.env.VERCEL_ORG_ID);
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) {
  throw new Error(`Vercel project authorization failed (HTTP ${response.status}). Replace VERCEL_TOKEN with a generated access token scoped to this project's team. Credentials are never printed.`);
}
console.log("Vercel project access verified.");
