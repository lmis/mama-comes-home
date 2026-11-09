#!/usr/bin/env bash
# Builds the single-file page: index.html
#   ONLY=fox ./build.sh   just the Fox Family book, with only its art (fox.html, small enough for an artifact)
set -euo pipefail
cd "$(dirname "$0")"
out=index.html; pat='art/*'
if [ "${ONLY:-}" = fox ]; then out=fox.html; pat='art/*fox-*'; fi
{
  cat head.html
  cat body.html
  echo '<script>'
  [ "${ONLY:-}" = fox ] && echo "window.ONLY_BOOK = 'fox';"
  # painted pictures from art/ ride along inside the page as data URIs
  echo 'const ART = {'
  for f in $pat.jpg $pat.png $pat.webp; do
    [ -e "$f" ] || continue
    n=$(basename "$f"); n=${n%.*}
    case "$f" in *.png) mime=image/png ;; *.webp) mime=image/webp ;; *) mime=image/jpeg ;; esac
    printf "  '%s': 'data:%s;base64,%s',\n" "$n" "$mime" "$(base64 -w0 "$f")"
  done
  echo '};'
  cat src/*.js
  echo '</script>'
} > "$out"
echo "wrote $(pwd)/$out ($(wc -c < "$out") bytes)"
