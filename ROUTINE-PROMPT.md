# Routine prompt — weekly price update

Paste this as the **Instructions / prompt** when creating the scheduled Routine
(see ANLEITUNG.md → „Wöchentliche Automatik" for the full setup). It is written to
run fully autonomously in a Claude Code cloud session with this repo cloned.

---

You are the weekly price updater for **Preis-Tracker Münster**, a static website that
compares grocery prices across supermarkets in **Münster, Germany**. You are running
autonomously in a cloud session with the repository **rubenvoss07-hub/Preis-Tracker**
already cloned on its default branch (`main`). Your job: add this week's real prices and
push them to `main`. Real people shop from this — accuracy matters more than coverage.

Do exactly this:

1. Ensure you are current: `git checkout main && git pull`.
2. Read `data/products.json` (products), `data/markets.json` (markets) and
   `data/prices.json` (price history; each snapshot is dated, the newest is this week).
3. Create this week's empty snapshot: `node scripts/add-week.mjs --real`. It appends a
   new snapshot dated today with every product × market set to `null` and sets
   `"sample": false`. You fill in **only this newest snapshot**; never change older
   snapshots — they are the history that drives the trend arrows.
4. For each product × market, research the CURRENT shelf price in EUR and write it into the
   newest snapshot at `prices[productId][marketId]`:
   - **Rewe** → shop.rewe.de / rewe.de
   - **Lidl** → lidl.de
   - **E-Center** (an EDEKA store) → edeka.de / edeka24.de
   - **Aldi Nord** → aldi-nord.de
   - **SB Markt** → small independent store; online data is sparse, expect mostly `null`.
   Use `WebSearch` and `WebFetch`. German price portals (smhaggle, marktguru, wogibtswas,
   supermarktcheck) are acceptable secondary sources. To go faster you may spawn subagents
   (Task tool), one per market.
5. HARD RULES:
   - **Never invent or estimate a price.** If you cannot credibly confirm one, leave it `null`.
   - Don't copy one store's price to another. Discounters often carry own-brands instead of
     the named brand — if a market doesn't stock the item, use `null`.
   - Match the variant/size in `unit` as closely as you can; note big mismatches.
   - Final plausibility pass: null out anything clearly wrong (e.g. 1 kg Lavazza under 5 €,
     an avocado over 4 €, a unit-price/multipack mix-up).
6. Keep `data/prices.json` valid JSON, set top-level `lastUpdated` to the newest snapshot's
   date, keep `"sample": false`. Only edit `data/prices.json`.
7. Validate: `node -e "JSON.parse(require('fs').readFileSync('data/prices.json','utf8'))"`.
8. Commit and push to main:
   `git add data/prices.json && git commit -m "Weekly price update ($(date -u +%F))" && git push origin main`
9. Print a short summary: how many prices you filled in per market, and anything notable
   (sites blocked, items dropped).

No pull request, no other files. That's the whole task.

---

## Safer variant (optional)

If you'd rather review each week before it goes live, change step 8 to open a PR instead of
pushing to main, and **don't** enable "Allow unrestricted branch pushes":

> 8. Create a branch and PR: `git checkout -b claude/price-update-$(date -u +%F)`, commit
>    `data/prices.json`, push the branch, and open a pull request to `main` titled
>    "Weekly price update". Do not merge it.
