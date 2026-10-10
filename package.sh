#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="$SCRIPT_DIR/dist"
mkdir -p "$DIST_DIR"

OUTPUT_ZIP="$DIST_DIR/easy-theme-switcher.zip"
OUTPUT_XPI="$DIST_DIR/easy-theme-switcher.xpi"

rm -f "$OUTPUT_ZIP" "$OUTPUT_XPI"

echo "Packaging Firefox extension..."

zip -r -FS "$OUTPUT_ZIP" \
  manifest.json \
  background.js \
  icons/*.png \
  icons/*.svg \
  popup/* \
  options/* \
  shared/* \
  -x "*.DS_Store" "*~"

cp "$OUTPUT_ZIP" "$OUTPUT_XPI"

echo "Successfully created:"
echo "  - $OUTPUT_ZIP"
echo "  - $OUTPUT_XPI"
echo "Done!"
