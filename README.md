# 🛒 Preis-Tracker Münster

Ein einfacher, hübscher Preisvergleich für Lebensmittel in Supermärkten in **Münster**.
Die Seite lädt die Preise aus einer JSON-Datei, die einmal pro Woche aktualisiert wird,
und zeigt für jedes Produkt den günstigsten Markt – plus einen Gesamtvergleich
(„welcher Markt ist insgesamt am günstigsten?").

Kein Build, keine Abhängigkeiten – reines HTML/CSS/JS. Läuft direkt auf **GitHub Pages**.

## Live ansehen

Sobald GitHub Pages aktiviert ist (siehe unten), liegt die Seite unter
`https://<dein-user>.github.io/Preis-Tracker/`.

Lokal testen – einfach einen kleinen Webserver im Projektordner starten
(wegen `fetch()` reicht ein Doppelklick auf `index.html` nicht):

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

```
data/
  products.json   ← Produkte (Name, Kategorie, Einheit, Emoji)   ← hier erweitern
  markets.json    ← Supermärkte (Name, Filiale, Farbe)           ← hier erweitern
  prices.json     ← die wöchentlichen Preise (wird automatisch aktualisiert)
css/styles.css    ← Design
js/app.js         ← Logik (lädt die JSONs, rendert die Seite)
scripts/          ← Hilfsskripte (Beispieldaten erzeugen, neue Woche anlegen)
index.html
```

Die Trennung ist Absicht: **Produkte und Märkte sind reine Konfiguration.**
Du musst keinen Code anfassen, um etwas hinzuzufügen.

## Produkt oder Markt hinzufügen

→ Siehe **[ANLEITUNG.md](ANLEITUNG.md)**. Kurz:

- **Produkt:** einen Eintrag in `data/products.json` ergänzen (eindeutige `id`).
- **Markt:** einen Eintrag in `data/markets.json` ergänzen (eindeutige `id`).

Beim nächsten Preis-Update werden neue Einträge automatisch berücksichtigt.

## Beispieldaten

Beim ersten Start enthält `data/prices.json` **Platzhalter-Preise** (`"sample": true`),
damit man die Seite gleich sieht. Ein dezenter Hinweis erscheint oben.
Neu erzeugen mit:

```bash
node scripts/generate-sample-data.mjs
```

Sobald echte Preise eingetragen sind, wird `"sample"` auf `false` gesetzt und der Hinweis verschwindet.

## Wöchentliches Update

Die Preise pflegt später eine wiederkehrende Aufgabe (z. B. Claude Code on the web).
Wie das Datenformat aussieht und wie man eine neue Woche anlegt, steht in **[ANLEITUNG.md](ANLEITUNG.md)**.

## GitHub Pages aktivieren

1. Repo bei GitHub → **Settings → Pages**.
2. Unter **Build and deployment → Source**: **GitHub Actions** wählen.
3. Der Workflow `.github/workflows/deploy.yml` veröffentlicht die Seite bei jedem Push auf `main`.

Alternativ unter **Source: Deploy from a branch** → `main` / `/ (root)` auswählen –
funktioniert genauso, da die Seite statisch ist.
