// Preis-Tracker Münster — loads modular config + weekly prices and renders.
// No build step, no dependencies. Works as a static site (e.g. GitHub Pages).

const fmt = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euro = (v) => fmt.format(v);

const state = {
  products: [],
  markets: [],
  data: null,        // full prices.json
  latest: null,      // latest snapshot
  prev: null,        // previous snapshot (for trends)
  search: "",
  category: "all",
  sort: "name",
  view: "cards",
};

const $ = (sel) => document.querySelector(sel);

init();

async function init() {
  const content = $("#content");
  try {
    const [products, markets, data] = await Promise.all([
      fetchJSON("data/products.json"),
      fetchJSON("data/markets.json"),
      fetchJSON("data/prices.json"),
    ]);
    state.products = products;
    state.markets = markets;
    state.data = data;

    const snaps = (data.snapshots || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    state.latest = snaps[snaps.length - 1] || { prices: {} };
    state.prev = snaps[snaps.length - 2] || null;

    renderUpdated();
    renderBanner();
    renderBasket();
    renderCategories();
    bindControls();
    render();
  } catch (err) {
    content.innerHTML = `<div class="state-msg"><p><strong>Daten konnten nicht geladen werden.</strong></p><p class="small">${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---------- price helpers ----------

// All known prices for a product in the latest snapshot, sorted cheapest first.
function pricesFor(productId, snap = state.latest) {
  const row = (snap?.prices || {})[productId] || {};
  return state.markets
    .map((m) => ({ market: m, value: typeof row[m.id] === "number" ? row[m.id] : null }))
    .filter((e) => e.value !== null)
    .sort((a, b) => a.value - b.value);
}

function bestPrice(productId) {
  return pricesFor(productId)[0] || null;
}

// % change of a market's price vs the previous snapshot.
function trendFor(productId, marketId) {
  if (!state.prev) return null;
  const now = state.latest.prices?.[productId]?.[marketId];
  const before = state.prev.prices?.[productId]?.[marketId];
  if (typeof now !== "number" || typeof before !== "number" || before === 0) return null;
  const pct = ((now - before) / before) * 100;
  if (Math.abs(pct) < 0.5) return { dir: "flat", pct: 0 };
  return { dir: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

// ---------- rendering: header bits ----------

function renderUpdated() {
  const date = state.data.lastUpdated;
  if (!date) return;
  $("#updatedText").textContent = `Stand: ${formatDate(date)}`;
  $("#updatedChip").hidden = false;
}

function renderBanner() {
  $("#sampleBanner").hidden = !state.data.sample;
}

function renderBasket() {
  const grid = $("#basketGrid");
  const sub = $("#basketSub");
  const priceOf = (pId, mId) => {
    const v = state.latest.prices?.[pId]?.[mId];
    return typeof v === "number" ? v : null;
  };

  // Only markets that have at least one price take part.
  const active = state.markets.filter((m) => state.products.some((p) => priceOf(p.id, m.id) !== null));

  // Fair comparison: the "common basket" = products priced at EVERY active market.
  const common = state.products.filter((p) => active.length > 0 && active.every((m) => priceOf(p.id, m.id) !== null));

  if (active.length < 2 || common.length < 2) {
    // Not enough overlapping data to compare fairly — show coverage only.
    sub.textContent = "Sobald genug Preise vorliegen, erscheint hier der Marktvergleich.";
    grid.innerHTML = active.map((m) => {
      const count = state.products.filter((p) => priceOf(p.id, m.id) !== null).length;
      return `<div class="basket-card">
        <span class="accent-bar" style="background:${m.color}"></span>
        <div class="basket-name">${escapeHtml(m.name)}</div>
        <div class="basket-branch">${escapeHtml(m.branch || "")}</div>
        <div class="basket-meta">${count} von ${state.products.length} Produkten gelistet</div>
      </div>`;
    }).join("");
    return;
  }

  sub.textContent = `Korb aus ${common.length} Produkten, die es in allen ${active.length} Märkten gibt — fairer Direktvergleich.`;

  const totals = active.map((m) => {
    let sum = 0;
    for (const p of common) sum += priceOf(p.id, m.id);
    const listed = state.products.filter((p) => priceOf(p.id, m.id) !== null).length;
    return { market: m, sum, listed };
  }).sort((a, b) => a.sum - b.sum);

  grid.innerHTML = totals.map((t, i) => `
    <div class="basket-card${i === 0 ? " winner" : ""}">
      <span class="accent-bar" style="background:${t.market.color}"></span>
      <div class="basket-rank">#${i + 1}${i === 0 ? " · Günstigster Korb" : ""}</div>
      <div class="basket-name">${escapeHtml(t.market.name)}
        ${i === 0 ? '<span class="winner-badge">★ Top</span>' : ""}
      </div>
      <div class="basket-branch">${escapeHtml(t.market.branch || "")}</div>
      <div class="basket-total">${euro(t.sum)}<span class="cur"> €</span></div>
      <div class="basket-meta">Vergleichskorb · ${t.listed}/${state.products.length} Produkte gelistet</div>
    </div>
  `).join("");
}

function renderCategories() {
  const cats = ["all", ...new Set(state.products.map((p) => p.category))];
  const labels = { all: "Alle" };
  $("#categoryChips").innerHTML = cats.map((c) =>
    `<button class="chip${c === state.category ? " active" : ""}" data-cat="${escapeHtml(c)}" role="tab">${escapeHtml(labels[c] || c)}</button>`
  ).join("");
}

// ---------- controls ----------

function bindControls() {
  $("#searchInput").addEventListener("input", (e) => { state.search = e.target.value.trim().toLowerCase(); render(); });
  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#categoryChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.category = btn.dataset.cat;
    document.querySelectorAll("#categoryChips .chip").forEach((c) => c.classList.toggle("active", c === btn));
    render();
  });
  $("#viewCards").addEventListener("click", () => setView("cards"));
  $("#viewTable").addEventListener("click", () => setView("table"));
}

function setView(view) {
  state.view = view;
  $("#viewCards").classList.toggle("active", view === "cards");
  $("#viewTable").classList.toggle("active", view === "table");
  $("#viewCards").setAttribute("aria-pressed", view === "cards");
  $("#viewTable").setAttribute("aria-pressed", view === "table");
  $("#cardView").hidden = view !== "cards";
  $("#tableView").hidden = view !== "table";
  render();
}

// ---------- filtering / sorting ----------

function visibleProducts() {
  let list = state.products.filter((p) => {
    if (state.category !== "all" && p.category !== state.category) return false;
    if (state.search) {
      const hay = `${p.name} ${p.subtitle} ${p.category}`.toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  });

  const cheapest = (p) => bestPrice(p.id)?.value ?? Infinity;
  const savings = (p) => {
    const prices = pricesFor(p.id);
    if (prices.length < 2) return -1;
    return prices[prices.length - 1].value - prices[0].value;
  };

  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  else if (state.sort === "cheapest") list.sort((a, b) => cheapest(a) - cheapest(b));
  else if (state.sort === "savings") list.sort((a, b) => savings(b) - savings(a));

  return list;
}

// ---------- main render ----------

function render() {
  const list = visibleProducts();
  $("#emptyState").hidden = list.length > 0;
  if (state.view === "cards") renderCards(list);
  else renderTable(list);
}

function renderCards(list) {
  $("#cardView").innerHTML = list.map(cardHTML).join("");
}

function cardHTML(p) {
  const prices = pricesFor(p.id);
  const best = prices[0] || null;

  const rows = state.markets.map((m) => {
    const v = state.latest.prices?.[p.id]?.[m.id];
    const has = typeof v === "number";
    const isBest = has && best && m.id === best.market.id && prices.filter((x) => x.value === best.value).length >= 1 && v === best.value;
    const t = has ? trendFor(p.id, m.id) : null;
    return `
      <li class="${isBest ? "is-best" : ""}">
        <span class="mkt-dot" style="background:${m.color}"></span>
        <span class="mkt-name">${escapeHtml(m.name)}</span>
        ${isBest ? '<span class="best-tag">Beste</span>' : ""}
        ${t ? trendHTML(t) : ""}
        <span class="price${has ? "" : " na"}">${has ? euro(v) + " €" : "–"}</span>
      </li>`;
  }).join("");

  return `
    <article class="p-card">
      <div class="p-head">
        <div class="p-emoji">${p.emoji || "🛒"}</div>
        <div class="p-title">
          <div class="p-name">${escapeHtml(p.name)}</div>
          <div class="p-sub">${escapeHtml(p.subtitle || "")}${p.unit ? " · " + escapeHtml(p.unit) : ""}</div>
        </div>
      </div>
      <div class="p-best">
        ${best ? `
          <div class="p-best-price">${euro(best.value)}<span class="cur"> €</span></div>
          <div class="p-best-where">
            <div class="lbl">am günstigsten</div>
            <div class="mkt">${escapeHtml(best.market.name)}</div>
          </div>` : `
          <div class="p-best-price" style="font-size:1.1rem;color:var(--ink-faint)">Keine Daten</div>`}
      </div>
      <ul class="p-prices">${rows}</ul>
    </article>`;
}

function trendHTML(t) {
  const arrow = t.dir === "up" ? "▲" : t.dir === "down" ? "▼" : "▬";
  const txt = t.dir === "flat" ? "" : `${t.pct.toFixed(0)}%`;
  return `<span class="trend ${t.dir}" title="Veränderung zur Vorwoche">${arrow}${txt ? " " + txt : ""}</span>`;
}

function renderTable(list) {
  const head = `
    <tr>
      <th class="prod-col">Produkt</th>
      ${state.markets.map((m) => `<th>${escapeHtml(m.name)}</th>`).join("")}
    </tr>`;

  const body = list.map((p) => {
    const prices = pricesFor(p.id);
    const min = prices[0]?.value ?? null;
    const cells = state.markets.map((m) => {
      const v = state.latest.prices?.[p.id]?.[m.id];
      if (typeof v !== "number") return `<td class="na">–</td>`;
      const cls = min !== null && v === min ? " best" : "";
      return `<td class="${cls.trim()}">${euro(v)} €</td>`;
    }).join("");
    return `
      <tr>
        <td class="prod-col"><span class="cell-prod"><span class="em">${p.emoji || "🛒"}</span><span class="nm">${escapeHtml(p.name)}</span></span></td>
        ${cells}
      </tr>`;
  }).join("");

  // Basket totals row.
  const totals = state.markets.map((m) => {
    let sum = 0, count = 0;
    for (const p of list) {
      const v = state.latest.prices?.[p.id]?.[m.id];
      if (typeof v === "number") { sum += v; count++; }
    }
    return { sum, count };
  });
  const minTotal = Math.min(...totals.filter((t) => t.count > 0).map((t) => t.sum));
  const foot = `
    <tr>
      <td class="prod-col">Summe (sichtbar)</td>
      ${totals.map((t) => t.count > 0
        ? `<td class="${t.sum === minTotal ? "best" : ""}">${euro(t.sum)} €</td>`
        : `<td class="na">–</td>`).join("")}
    </tr>`;

  $("#tableView").innerHTML = `<table class="price-table">
    <thead>${head}</thead>
    <tbody>${body}</tbody>
    <tfoot>${foot}</tfoot>
  </table>`;
}

// ---------- utils ----------

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
