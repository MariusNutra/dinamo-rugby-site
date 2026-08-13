#!/bin/bash
#
# Rulare saptamanala a scraperului de rezultate (rugbyromania.ro).
#
# Scraperul isi scrie singur jurnalul in data/scraper.log. De aceea iesirea de
# aici NU merge in acelasi fisier: pana in februarie asa se rula, si fiecare
# linie ajungea de doua ori — o data scrisa de logger, o data de redirectare.
# Aici se aduna doar ce nu prinde loggerul: caderi de node, erori de npm.
#
# Rezultatele se citesc din fisier la fiecare cerere (lib/results.ts, cache de
# un minut), deci NU e nevoie de rebuild sau restart dupa actualizare.

set -uo pipefail

APP_DIR="/mnt/HC_Volume_105236627/www/rugby-dinamo"
LOG="/var/log/rugby-dinamo-scraper.log"
LOCK="/tmp/rugby-dinamo-scrape.lock"
MAX_LOG=2000000  # 2 MB

# Cronul porneste cu un PATH sarac; fara asta, `npm` nu se gaseste.
export PATH="/usr/local/bin:/usr/bin:/bin"

# Daca rularea anterioara inca merge, nu pornim a doua peste ea.
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[$(date -Is)] O rulare e deja in curs; sar peste." >> "$LOG"
  exit 0
fi

# Taiem jurnalul cand creste prea mult, pastrand coada.
if [ -f "$LOG" ] && [ "$(stat -c %s "$LOG")" -gt "$MAX_LOG" ]; then
  tail -c 500000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

cd "$APP_DIR" || { echo "[$(date -Is)] Nu pot intra in $APP_DIR" >> "$LOG"; exit 1; }

echo "[$(date -Is)] === pornire ===" >> "$LOG"
npm run scrape >> "$LOG" 2>&1
COD=$?

if [ $COD -eq 0 ]; then
  # Verificam ca fisierul chiar s-a improspatat, nu doar ca procesul a iesit cu
  # zero: scraperul pastreaza DELIBERAT datele vechi cand nu gaseste nimic, si
  # atunci iesirea e tot 0. Fara verificarea asta, o sursa schimbata ar trece
  # drept succes saptamani la rand.
  VARSTA=$(( $(date +%s) - $(stat -c %Y "$APP_DIR/data/rugby-results.json") ))
  if [ "$VARSTA" -lt 300 ]; then
    echo "[$(date -Is)] === gata: date improspatate ===" >> "$LOG"
  else
    echo "[$(date -Is)] === ATENTIE: rulare fara eroare, dar fisierul nu s-a schimbat (vechi de ${VARSTA}s) ===" >> "$LOG"
  fi
else
  echo "[$(date -Is)] === EROARE: cod de iesire $COD ===" >> "$LOG"
fi

exit $COD
