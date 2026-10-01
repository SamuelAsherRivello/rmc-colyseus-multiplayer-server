// Read-only probe. Never print credentials, identifiers or raw API responses.
for (const key of ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const headers = { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
async function read(path, scoped = false) {
  const url = new URL(path, 'https://api.vercel.com');
  if (scoped) url.searchParams.set('teamId', process.env.VERCEL_ORG_ID);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Hosting capability read failed: HTTP ${response.status}`);
  return response.json();
}
const project = await read(`/v9/projects/${encodeURIComponent(process.env.VERCEL_PROJECT_ID)}`, true);
const team = await read(`/v2/teams/${encodeURIComponent(process.env.VERCEL_ORG_ID)}`);
console.log(JSON.stringify({
  plan: team.billing?.plan ?? 'unavailable',
  framework: project.framework ?? 'unavailable',
  fluid: project.resourceConfig?.fluid ?? 'unavailable',
  functionDefaultTimeout: project.resourceConfig?.functionDefaultTimeout ?? 'unavailable',
}, null, 2));
