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

## 5. Die wöchentliche Automatik (Claude-Routine)

Die Preise aktualisiert eine **Claude-Code-Routine** einmal pro Woche automatisch.
Eine Routine ist ein gespeicherter Prompt, der nach Zeitplan in einer Cloud-Umgebung
von Anthropic läuft – ganz ohne deinen Rechner und **ohne API-Key** (läuft über dein
Claude-Abo). Sie macht genau das, was wir hier von Hand gemacht haben: Preise
recherchieren, in `data/prices.json` eintragen, auf `main` pushen → die Seite
aktualisiert sich.

Der fertige Prompt liegt in **[ROUTINE-PROMPT.md](ROUTINE-PROMPT.md)**.

### Einrichtung (einmalig, ~3 Minuten)

1. Gehe zu **<https://claude.ai/code/routines>** und klicke **New routine**
   (oder im CLI: `/schedule weekly Münster price update`).
2. **Name** z. B. „Preis-Tracker Münster – wöchentlich".
3. **Prompt/Instructions:** den Inhalt von `ROUTINE-PROMPT.md` einfügen.
4. **Repository:** `rubenvoss07-hub/Preis-Tracker` auswählen.
5. **Environment / Network access:** auf **Full** stellen (oder **Custom** mit den
   Domains der Ketten und Preisportale). Die Standard-Einstellung „Trusted" **blockt**
   die Supermarkt-Seiten – dann findet die Routine keine Preise.
6. **Connectors:** alle entfernen – die Routine braucht keine. (Lässt man fremde
   Connectors drin, kann das Anlegen fehlschlagen.)
7. **Permissions:** **„Uneingeschränkten Git-Push erlauben" NICHT aktivieren.** Mit dieser
   Standard-Einstellung pusht die Routine auf einen `claude/…`-Branch und öffnet einen
   Pull Request – genau das macht der Prompt. Den PR mergst du einmal pro Woche mit einem
   Klick, dann aktualisiert sich die Seite.
   *(Hinweis: Das Aktivieren des Schalters schlägt fehl, solange die Claude-GitHub-App keine
   Schreibrechte aufs Repo hat. Nur nötig, wenn du den direkten `main`-Push willst – siehe
   „Direct-to-main variant" in ROUTINE-PROMPT.md.)*
8. **Trigger:** **Schedule → Weekly** wählen, Tag/Uhrzeit nach Wunsch.
9. **Create.** Mit **Run now** lässt sich der erste Lauf sofort testen.

> Sicherheit: Wähle nur dieses eine Repo aus und entferne nicht benötigte Connectors.
> Die Routine läuft autonom mit Schreibrechten und Web-Zugriff – gib ihr nur, was sie braucht.

### Manuell eine Woche nachtragen

Geht weiterhin jederzeit von Hand (ohne Automatik):

```bash
node scripts/add-week.mjs 2026-07-01 --real   # leeren Snapshot anlegen
# Preise in data/prices.json eintragen, dann committen & pushen
```
