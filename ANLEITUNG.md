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

## 5. Ablauf der späteren Automatik (zur Info)

Die wiederkehrende Aufgabe soll grob so arbeiten:

1. `data/products.json` und `data/markets.json` lesen → was ist zu prüfen?
2. Für jedes Produkt je Markt den aktuellen Preis in Münster recherchieren.
3. `node scripts/add-week.mjs <datum> --real` ausführen.
4. Preise in `data/prices.json` eintragen.
5. Committen & pushen → GitHub Pages aktualisiert die Seite automatisch.

> Die Automatik wird später eingerichtet – erst prüfen wir mit den Beispieldaten,
> ob die Seite so gefällt.
