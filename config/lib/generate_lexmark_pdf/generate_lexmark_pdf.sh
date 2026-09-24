#!/bin/sh
set -eu

if [ "${1:-}" = "" ]; then
    echo "Missing printer host suffix" >&2
    exit 1
fi

host_suffix="$1"
base_url="http://192.168.3.${host_suffix}"
report_url="${base_url}/cgi-bin/dynamic/printer/config/reports/devicestatistics.html"
date_dir="$(date +%Y_%m_%d)"
output_dir="/data/temp/Lexmark/${date_dir}"
owncloud_base_url="${OWNCLOUD_BASE_URL:?Missing OWNCLOUD_BASE_URL}"
owncloud_user="${OWNCLOUD_USER:?Missing OWNCLOUD_USER}"
owncloud_pass="${OWNCLOUD_PASSWORD:?Missing OWNCLOUD_PASSWORD}"
owncloud_root="${OWNCLOUD_PRINTERS_PATH:?Missing OWNCLOUD_PRINTERS_PATH}"

mkdir -p "$output_dir"

html_file="$(mktemp)"
trap 'rm -f "$html_file"' EXIT

curl -fsS "$report_url" -o "$html_file"

pdf_name="$(python3 - "$html_file" "$host_suffix" <<'PY'
import html
import re
import sys
from pathlib import Path

raw = Path(sys.argv[1]).read_bytes().decode("iso-8859-1", errors="ignore")
host_suffix = sys.argv[2]

def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def safe_filename(value: str) -> str:
    value = strip_tags(value)
    value = re.sub(r'[\\/:*?"<>|]+', "-", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

model_match = re.search(
    r"Nombre de modelo</p></td><td><p>\s*(.*?)\s*</p>",
    raw,
    re.IGNORECASE | re.DOTALL,
)

serial_matches = re.findall(
    r'margin-left:\s*30;[^>]*>N(?:ú|u)mero de serie</p></td><td><p>\s*(.*?)\s*</p>',
    raw,
    re.IGNORECASE | re.DOTALL,
)

if not serial_matches:
    serial_matches = re.findall(
        r"N(?:ú|u)mero de serie</p></td><td><p>\s*(.*?)\s*</p>",
        raw,
        re.IGNORECASE | re.DOTALL,
    )

model = safe_filename(model_match.group(1) if model_match else f"Impresora_{host_suffix}")
serial = safe_filename(serial_matches[-1] if serial_matches else host_suffix)
serial = serial[-5:] if len(serial) > 5 else serial

print(f"{model}_{serial}.pdf")
PY
)"

output_file="${output_dir}/${pdf_name}"
remote_dir="${owncloud_root}/${date_dir}"
remote_file="${remote_dir}/$(python3 - "$pdf_name" <<'PY'
import sys
import urllib.parse
print(urllib.parse.quote(sys.argv[1]))
PY
)"

chromium \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    --print-to-pdf="$output_file" \
    "$report_url" >/tmp/chromium_lexmark.log 2>&1

curl -k -fsS \
  -u "${owncloud_user}:${owncloud_pass}" \
  -X MKCOL "${owncloud_base_url}${remote_dir}" >/dev/null 2>&1 || true

curl -k -fsS \
  -u "${owncloud_user}:${owncloud_pass}" \
  -T "$output_file" \
  "${owncloud_base_url}${remote_file}" >/dev/null

printf '%s\n' "${owncloud_base_url}${remote_file}"
