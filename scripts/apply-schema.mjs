// Applies supabase/schema.sql plus catalog seed data (metrics, reviews, events)
// to the project's Supabase Postgres via the direct connection string.
//
//   SUPABASE_DB_PASSWORD="..." node scripts/apply-schema.mjs
//
// Only the public project URL is read from .env; the password comes from the
// invocation environment and is never written anywhere.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const pg = require("pg");

const root = process.cwd();

function readEnvFile(file) {
  const vars = {};
  if (!fs.existsSync(file)) return vars;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
    if (m) vars[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  return vars;
}

const env = readEnvFile(path.join(root, ".env"));
const supabaseUrl = env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL missing from .env");
const dbHost = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];
const writeOnly = process.argv.includes("--write");
const password = process.env.SUPABASE_DB_PASSWORD;
if (!writeOnly && !password) throw new Error("Set SUPABASE_DB_PASSWORD in the environment.");

// Bundle the catalog so the seed is derived from the same source as the app.
execSync(
  `npx esbuild src/lib/catalog.ts --bundle --format=esm --outfile=.tmp/catalog.mjs --log-level=error`,
  { stdio: "inherit" },
);
const { SEED_ITEMS, seedReviews } = await import(pathToFileURL(path.resolve(".tmp/catalog.mjs")).href);

const esc = (value) => (value === null || value === undefined ? "null" : `'${String(value).replace(/'/g, "''")}'`);

const metricRows = SEED_ITEMS.map(
  (i) => `(${esc(i.slug)}, ${i.installs}, ${i.views}, ${i.runs})`,
).join(",\n");
const reviewRows = seedReviews()
  .map((r) => `(${esc(r.slug)}, ${esc(r.author)}, ${r.rating}, ${esc(r.text)}, ${esc(r.created)})`)
  .join(",\n");

const seedEvents = [
  ["publish", "promptforge", "synth_core", "2026-10-24"],
  ["install", "json2schema", "gridlock", "2026-10-25"],
  ["review", "deep-research", "lunarPunk", "2026-10-25"],
  ["publish", "git-daily", "kaito_dev", "2026-10-26"],
  ["install", "socratic-tutor", "pixelprophet", "2026-10-26"],
  ["install", "code-review-copilot", "ami.exe", "2026-10-27"],
  ["review", "text-xray", "byteBard", "2026-10-27"],
  ["publish", "synth-muse", "void_arch", "2026-10-28"],
];
const eventRows = seedEvents.map((e) => `(${esc(e[0])}, ${esc(e[1])}, ${esc(e[2])}, ${esc(e[3])})`).join(",\n");

const seedSql = `
insert into metrics (slug, installs, views, runs) values
${metricRows}
on conflict (slug) do update set
  installs = greatest(metrics.installs, excluded.installs),
  views = greatest(metrics.views, excluded.views),
  runs = greatest(metrics.runs, excluded.runs);

-- Reviews are seeded once per listing that has none.
${SEED_ITEMS.map(
  (i) =>
    `insert into reviews (item_slug, author, rating, text, created)\nselect * from (values\n${seedReviews()
      .filter((r) => r.slug === i.slug)
      .map((r) => `(${esc(r.slug)}, ${esc(r.author)}, ${r.rating}, ${esc(r.text)}, ${esc(r.created)})`)
      .join(",\n")}) as v\nwhere not exists (select 1 from reviews where item_slug = ${esc(i.slug)});`,
).join("\n")}

insert into events (type, item_slug, meta, created)
select * from (values
${eventRows}) as v
where not exists (select 1 from events limit 1);
`;

const schemaSql = `${fs.readFileSync(path.join(root, "supabase/schema.sql"), "utf8")}\n-- ── catalog seed (idempotent) ─────────────────────────────────────────────\n${seedSql}\n`;

const outPath = writeOnly ? path.join(root, "supabase/setup.sql") : null;

if (outPath) {
  fs.writeFileSync(outPath, `-- Synthsynd World — one-shot database setup.\n-- Paste the whole file into Supabase → SQL editor and run it once.\n-- It is safe to re-run; every step is idempotent.\n\n${schemaSql}`);
  console.log("wrote", outPath, "— run it in the Supabase SQL editor");
  process.exit(0);
}

const client = new pg.Client({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 5432,
  user: `postgres.${dbHost}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

await client.connect();
try {
  const schema = fs.readFileSync(path.join(root, "supabase/schema.sql"), "utf8");
  await client.query(schema);
  console.log("schema applied");
  await client.query(seedSql);
  console.log("seed applied");
  const counts = await client.query(
    "select (select count(*) from reviews) as reviews, (select count(*) from metrics) as metrics, (select count(*) from events) as events, (select count(*) from published_items) as published",
  );
  console.log("counts:", counts.rows[0]);
} finally {
  await client.end();
}
