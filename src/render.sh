#!/usr/bin/env bash
# Regenerate the PDF from deck.html using headless Chromium.
# Requires a Chromium/Chrome binary; set CHROME to its path if not on PATH.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || echo /opt/pw-browsers/chromium)}"
"$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --no-pdf-header-footer \
  --print-to-pdf="../Drone-Kairos-ERP-Apresentacao.pdf" "file://$PWD/deck.html"
echo "PDF written to ../Drone-Kairos-ERP-Apresentacao.pdf"
