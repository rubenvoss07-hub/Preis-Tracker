#!/usr/bin/env node
/**
 * Generates a sample data/prices.json with a few weeks of plausible history.
 *
 * This is ONLY for getting the site to look alive before the first real price
 * scan runs. It is deterministic (no randomness) so re-running gives the same
 * output. Once you have real prices, the recurring task replaces this file and
 * sets "sample": false.
 *
 *   node scripts/generate-sample-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
const markets = JSON.parse(readFileSync(join(root, "data/markets.json"), "utf8"));

// Approximate regular shelf price (€) per product — just a believable anchor.
const basePrice = {
  frosta: 3.49, "pizza-oetker": 2.99, "mccain-longs": 2.79, "iglo-nuggets": 3.49,
  "lachs-blaetter": 3.99, magnum: 2.99, "jever-fun": 4.99, "jever-blutorange": 4.99,
  "salvus-zitrone": 5.99, "salvus-lemon": 5.99, "coca-cola": 1.99, "fanta-sprite": 1.79,
  "elephant-bay": 1.29, "monster-doctor": 1.49, "sylter-caesars": 1.99,
  "damhus-wuerstchen": 2.29, "weihen-kochsahne": 0.99, "weihen-fruchtquark": 1.19,
  "lavazza-cremoso": 13.99, "barilla-nudeln": 1.79, nutella: 3.29, avocado: 1.19,
  develey: 1.49, remia: 1.99, "lukull-hollandaise": 0.85, "maredo-rind": 6.49,
};

// Discounters tend to be a bit cheaper; some don't carry every branded item.
const marketFactor = {
  "rewe-metzer": 1.06, lidl: 0.92, "ecenter-ebert": 1.03, "aldi-nord": 0.9, "sb-markt": 0.99,
};

// Branded specialities a hard discounter may not stock (deterministic gaps).
const notStocked = {
  lidl: ["jever-blutorange", "salvus-zitrone", "salvus-lemon", "lavazza-cremoso", "maredo-rind"],
  "aldi-nord": ["jever-fun", "jever-blutorange", "monster-doctor", "sylter-caesars", "develey", "remia"],
  "sb-markt": ["lachs-blaetter"],
};

// Tiny deterministic "hash noise" so weekly prices wiggle without randomness.
const noise = (a, b) => {
  let h = 2166136261;
  for (const ch of `${a}|${b}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000; // 0..1
};

const round99 = (v) => Math.max(0.19, Math.round(v * 100) / 100);

// Three Wednesdays of history (oldest first). Dates are fixed for determinism.
const dates = ["2026-06-10", "2026-06-17", "2026-06-24"];

const snapshots = dates.map((date, week) => {
  const prices = {};
  for (const p of products) {
    const row = {};
    for (const m of markets) {
      if ((notStocked[m.id] || []).includes(p.id)) { row[m.id] = null; continue; }
      const base = basePrice[p.id] ?? 1.99;
      const drift = (noise(p.id, m.id) - 0.5) * 0.18;            // ±9% steady offset
      const weekly = (noise(`${p.id}-${week}`, m.id) - 0.5) * 0.12; // ±6% per week
      row[m.id] = round99(base * (marketFactor[m.id] + drift + weekly));
    }
    prices[p.id] = row;
  }
  return { date, prices };
});

const out = {
  currency: "EUR",
  city: "Münster",
  lastUpdated: dates[dates.length - 1],
  sample: true,
  snapshots,
};

writeFileSync(join(root, "data/prices.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote data/prices.json — ${snapshots.length} weeks, ${products.length} products, ${markets.length} markets.`);
