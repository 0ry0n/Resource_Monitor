#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="Resource_Monitor@Ory0n"
POT_PATH="${1:-$ROOT_DIR/po/$DOMAIN.pot}"

mapfile -t JS_FILES < <(
  cd "$ROOT_DIR"
  find "Resource_Monitor@Ory0n" -type f -name '*.js' | LC_ALL=C sort
)

mkdir -p "$(dirname "$POT_PATH")"

if command -v xgettext >/dev/null 2>&1; then
  (
    cd "$ROOT_DIR"
    xgettext \
      --from-code=UTF-8 \
      --language=JavaScript \
      --keyword=_ \
      --package-name="Resource_Monitor" \
      --package-version="1" \
      --msgid-bugs-address="https://github.com/0ry0n/Resource_Monitor/issues" \
      --output="$POT_PATH" \
      "${JS_FILES[@]}"
  )
  exit 0
fi

cat > "$POT_PATH" <<'HEADER'
# Resource_Monitor translations template.
# Copyright (C) 2026
# This file is distributed under the same license as Resource_Monitor.
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: Resource_Monitor\\n"
"Report-Msgid-Bugs-To: https://github.com/0ry0n/Resource_Monitor/issues\\n"
"POT-Creation-Date: 2026-03-18 00:00+0000\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

HEADER

(
  cd "$ROOT_DIR"
  perl -0777 -ne 'while(/_\(\s*"((?:\\.|[^"\\])*)"\s*\)/gs){$s=$1;$s=~s/\\"/"/g;$s=~s/\\\\/\\/g;print "$s\n"}' "${JS_FILES[@]}" \
    | LC_ALL=C sort -u \
    | while IFS= read -r msgid; do
        escaped=${msgid//\\/\\\\}
        escaped=${escaped//\"/\\\"}
        printf '\nmsgid "%s"\nmsgstr ""\n' "$escaped" >> "$POT_PATH"
      done
)
