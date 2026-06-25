#!/usr/bin/env node
/**
 * Adds a new (empty) weekly price snapshot to data/prices.json, ready to fill in.
 *
 * The recurring update task runs this, then fills in the prices it found and
 * commits. Every current product × market gets a slot (value `null` = no data
 * / not checked yet). Products or markets added to the config files later are
 * picked up automatically the next time you run this.
 *
 *   node scripts/add-week.mjs 2026-07-01     # add a snapshot for that date
 *   node scripts/add-week.mjs                 # use today's date
 *
 * Pass --real to also flip the "sample" flag off (do this on the first real run).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((a) => a !== "--real");
const markReal = process.argv.includes("--real");

const date = args[0] || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`Invalid date "${date}". Use YYYY-MM-DD.`);
  process.exit(1);
}

const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
const markets = JSON.parse(readFileSync(join(root, "data/markets.json"), "utf8"));
const pricesPath = join(root, "data/prices.json");

let data;
try {
  data = JSON.parse(readFileSync(pricesPath, "utf8"));
} catch {
  data = { currency: "EUR", city: "Münster", lastUpdated: date, sample: true, snapshots: [] };
}
data.snapshots = data.snapshots || [];

if (data.snapshots.some((s) => s.date === date)) {
  console.error(`A snapshot for ${date} already exists. Edit it directly in data/prices.json.`);
  process.exit(1);
}

const prices = {};
for (const p of products) {
  prices[p.id] = {};
  for (const m of markets) prices[p.id][m.id] = null;
}

data.snapshots.push({ date, prices });
data.snapshots.sort((a, b) => a.date.localeCompare(b.date));
data.lastUpdated = data.snapshots[data.snapshots.length - 1].date;
if (markReal) data.sample = false;

writeFileSync(pricesPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Added empty snapshot for ${date}. Fill in the prices in data/prices.json and commit.`);
