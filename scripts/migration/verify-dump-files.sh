#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <dump-file> [more-files...]" >&2
  exit 1
fi

hash_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
    return
  fi

  echo "No SHA-256 tool found (expected sha256sum or shasum)." >&2
  exit 1
}

for file in "$@"; do
  if [ ! -e "$file" ]; then
    echo "MISSING: $file" >&2
    exit 1
  fi
  if [ ! -f "$file" ]; then
    echo "NOT_A_FILE: $file" >&2
    exit 1
  fi

  if command -v stat >/dev/null 2>&1; then
    size_bytes="$(stat -c '%s' "$file" 2>/dev/null || stat -f '%z' "$file")"
  else
    size_bytes="UNKNOWN"
  fi

  echo "FILE: $file"
  echo "SIZE_BYTES: $size_bytes"
  echo "SHA256: $(hash_file "$file")"
  echo
 done