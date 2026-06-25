# Anleitung – Produkte, Märkte & Preise pflegen

Alles, was die Seite anzeigt, kommt aus drei Dateien im Ordner `data/`.
Du brauchst keine Programmierkenntnisse – es sind nur Listen.

---

## 1. Ein Produkt hinzufügen

Öffne `data/products.json` und füge einen Block hinzu (Komma nicht vergessen):

```json
{ "id": "club-mate", "name": "Club Mate", "subtitle": "Erfrischung", "category": "Getränke", "unit": "0,5 l", "emoji": "🧉" }
```

| Feld       | Bedeutung                                                            |
|------------|---------------------------------------------------------------------|
| `id`       | **Eindeutig**, klein, ohne Leerzeichen (z. B. `club-mate`). Nicht mehr ändern. |
| `name`     | Anzeigename                                                         |
| `subtitle` | kleiner Zusatz unter dem Namen (optional)                          |
| `category` | gruppiert die Filter-Chips (z. B. `Getränke`, `Tiefkühl`, `Vorrat`) |
| `unit`     | Packungsgröße (optional, z. B. `500 g`)                            |
| `emoji`    | Symbol auf der Karte (optional)                                    |

Eine neue Kategorie entsteht automatisch, sobald ein Produkt sie benutzt.

## 2. Einen Markt hinzufügen

Öffne `data/markets.json`:

```json
{ "id": "edeka-zentrum", "name": "Edeka", "branch": "Zentrum", "color": "#f9c100" }
```

| Feld     | Bedeutung                                       |
|----------|-------------------------------------------------|
| `id`     | **Eindeutig**, klein (z. B. `edeka-zentrum`).   |
| `name`   | Anzeigename                                     |
| `branch` | Filiale / Ort (optional)                        |
| `color`  | Farbpunkt der Marke (Hex, optional)             |

Neue Märkte tauchen ab dem nächsten Preis-Update überall auf.

---

## 3. Preise – das Datenformat

`data/prices.json` ist eine Historie aus wöchentlichen „Snapshots":

```json
{
  "currency": "EUR",
  "city": "Münster",
  "lastUpdated": "2026-06-24",
  "sample": false,
  "snapshots": [
    {
      "date": "2026-06-24",
      "prices": {
        "frosta":     { "rewe-metzer": 3.49, "lidl": 2.99, "aldi-nord": null },
        "coca-cola":  { "rewe-metzer": 1.99, "lidl": 1.79 }
      }
    }
  ]
}
```

Regeln:

- Schlüssel unter `prices` sind **Produkt-`id`s**, darunter **Markt-`id`s** → Preis als Zahl.
- `null` (oder weglassen) = kein Preis / nicht geführt → erscheint als „–".
- Die Seite nimmt automatisch den **neuesten** Snapshot und vergleicht ihn mit dem
  vorherigen für die Trend-Pfeile (▲ teurer / ▼ günstiger als letzte Woche).
- `"sample": true` zeigt oben den Beispieldaten-Hinweis. Bei echten Daten auf `false`.

## 4. Eine neue Woche eintragen

Bequem mit dem Hilfsskript – legt einen leeren Snapshot für alle aktuellen
Produkte × Märkte an:

```bash
node scripts/add-week.mjs 2026-07-01        # Datum der Erhebung
# beim allerersten echten Lauf zusätzlich den Beispiel-Hinweis abschalten:
node scripts/add-week.mjs 2026-07-01 --real
```

Danach in `data/prices.json` die gefundenen Preise eintragen (statt `null`) und committen.

## 5. Die wöchentliche Automatik

Die Preise aktualisiert ein **GitHub-Action-Job einmal pro Woche** automatisch:
`.github/workflows/weekly-price-update.yml`. Er läuft jeden Montagmorgen (und lässt
sich jederzeit von Hand starten unter **Actions → „Weekly price update" → Run workflow**).

Ablauf des Jobs:

1. legt mit `scripts/add-week.mjs --real` einen neuen, leeren Snapshot für die Woche an,
2. startet Claude headless mit den Anweisungen aus `.github/price-update-prompt.md`,
3. Claude recherchiert je Produkt × Markt den aktuellen Preis (echte Online-Shops der
   Ketten) und trägt ihn ein – nicht Auffindbares bleibt `null`, **nichts wird geraten**,
4. committet `data/prices.json` auf `main` → GitHub Pages veröffentlicht die Seite neu.

### Einmalige Einrichtung (nötig, sonst überspringt der Job sich selbst)

Ein Repository-Secret **`ANTHROPIC_API_KEY`** hinterlegen:

1. API-Key erstellen auf <https://console.anthropic.com>.
2. Im Repo: **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `ANTHROPIC_API_KEY`, Wert: der Key. Speichern.

Ohne dieses Secret läuft der Job ohne Fehler durch und tut einfach nichts.

### Manuell eine Woche nachtragen

Geht weiterhin jederzeit von Hand (ohne Automatik):

```bash
node scripts/add-week.mjs 2026-07-01 --real   # leeren Snapshot anlegen
# Preise in data/prices.json eintragen, dann committen & pushen
```
