#!/bin/sh
set -eu

base_url="${OWNCLOUD_BASE_URL:?Missing OWNCLOUD_BASE_URL}"
dav_path="${OWNCLOUD_DAV_PATH:?Missing OWNCLOUD_DAV_PATH}"
dav_url="${base_url}${dav_path}"
username="${OWNCLOUD_USER:?Missing OWNCLOUD_USER}"
password="${OWNCLOUD_PASSWORD:?Missing OWNCLOUD_PASSWORD}"
date_dir="$(date +%Y_%m_%d)"
output_dir="/data/temp/owncloud/${date_dir}"
output_file="${output_dir}/directories.json"

mkdir -p "$output_dir"

xml_file="$(mktemp)"
trap 'rm -f "$xml_file"' EXIT

curl -k -fsS \
  -u "${username}:${password}" \
  -X PROPFIND "$dav_url" \
  -H "Depth: 1" \
  -H "Content-Type: application/xml" \
  --data '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>' \
  -o "$xml_file"

python3 - "$xml_file" "$output_file" "$base_url" "$dav_url" <<'PY'
import json
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

xml_path, output_path, base_url, dav_url = sys.argv[1:5]
ns = {"d": "DAV:"}

root = ET.parse(xml_path).getroot()
directories = []

for response in root.findall("d:response", ns):
    href = response.findtext("d:href", default="", namespaces=ns)
    resource_type = response.find(".//d:resourcetype/d:collection", ns)
    if resource_type is None:
        continue
    decoded = urllib.parse.unquote(href)
    if decoded.rstrip("/") == "/remote.php/dav/files/ait":
        continue
    name = decoded.rstrip("/").split("/")[-1]
    directories.append(
        {
            "name": name,
            "href": href,
            "url": urllib.parse.urljoin(base_url, href.lstrip("/")),
        }
    )

result = {
    "base_url": base_url,
    "dav_url": dav_url,
    "count": len(directories),
    "directories": directories,
    "saved_to": output_path,
}

Path(output_path).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False))
PY
