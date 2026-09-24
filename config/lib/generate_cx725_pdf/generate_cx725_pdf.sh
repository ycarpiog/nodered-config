#!/bin/sh
set -eu

if [ "${1:-}" = "" ]; then
    echo "Missing printer host suffix" >&2
    exit 1
fi

host_suffix="$1"
base_url="http://192.168.3.${host_suffix}"
popup_url="${base_url}/#/Settings/Reports/ReportDeviceStatisticsPopup"
date_dir="$(date +%Y_%m_%d)"
output_dir="/data/temp/CX725/${date_dir}"
owncloud_base_url="${OWNCLOUD_BASE_URL:?Missing OWNCLOUD_BASE_URL}"
owncloud_user="${OWNCLOUD_USER:?Missing OWNCLOUD_USER}"
owncloud_pass="${OWNCLOUD_PASSWORD:?Missing OWNCLOUD_PASSWORD}"
owncloud_root="${OWNCLOUD_PRINTERS_PATH:?Missing OWNCLOUD_PRINTERS_PATH}"

mkdir -p "$output_dir"

html_file="$(mktemp)"
fragment_file="$(mktemp /tmp/cx725_fragmentXXXXXX)"
mv "$fragment_file" "${fragment_file}.html"
fragment_file="${fragment_file}.html"
pdf_tmp="$(mktemp /tmp/cx725_pdfXXXXXX)"
trap 'rm -f "$html_file" "$fragment_file" "$pdf_tmp"' EXIT

chromium \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --virtual-time-budget=12000 \
    --dump-dom "$popup_url" > "$html_file" 2>/tmp/cx725_dom.err

pdf_name="$(
python3 - "$html_file" "$fragment_file" "$base_url" "$host_suffix" <<'PY'
import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

raw = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
fragment_file = Path(sys.argv[2])
base_url = sys.argv[3]
host_suffix = sys.argv[4]

class ReportExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.capture_depth = 0
        self.capture = []

    def handle_starttag(self, tag, attrs):
        if tag == "div":
            attrs_map = dict(attrs)
            classes = attrs_map.get("class", "")
            if "report-container" in classes.split():
                self.capture_depth = 1
                self.capture.append(self.get_starttag_text())
                return
        if self.capture_depth:
            self.capture_depth += 1
            self.capture.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if self.capture_depth:
            self.capture.append(f"</{tag}>")
            self.capture_depth -= 1

    def handle_startendtag(self, tag, attrs):
        if self.capture_depth:
            self.capture.append(self.get_starttag_text())

    def handle_data(self, data):
        if self.capture_depth:
            self.capture.append(data)

    def handle_comment(self, data):
        if self.capture_depth:
            self.capture.append(f"<!--{data}-->")

    def handle_entityref(self, name):
        if self.capture_depth:
            self.capture.append(f"&{name};")

    def handle_charref(self, name):
        if self.capture_depth:
            self.capture.append(f"&#{name};")

def clean(value: str) -> str:
    value = html.unescape(value).replace("&nbsp;", " ")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r'[\\/:*?"<>|]+', "-", value)
    return value

def strip_tags(value: str) -> str:
    value = html.unescape(value).replace("&nbsp;", " ")
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

EXACT_TRANSLATIONS = {
    "Device Statistics": "Estadísticas del dispositivo",
    "Job Information": "Información del trabajo",
    "Printed by Emulation": "Impreso por emulación",
    "Jobs by document length": "Trabajos por longitud del documento",
    "Jobs by Document Length": "Trabajos por longitud del documento",
    "Long job": "Trabajo largo",
    "Job Length": "Longitud del trabajo",
    "Job Count": "Cantidad de trabajos",
    "Avg Job": "Prom. trabajo",
    "Avg Job Length": "Longitud promedio del trabajo",
    "Print and Hold Count of Jobs": "Cantidad de trabajos de impresión retenida",
    "Pages from Print and Hold Jobs": "Páginas de trabajos de impresión retenida",
    "Last Printed Job": "Último trabajo impreso",
    "Last Scan Job": "Último trabajo escaneado",
    "USB Direct Jobs": "Trabajos directos por USB",
    "Other Job Data": "Otros datos del trabajo",
    "Media Sheet Count": "Cantidad de hojas del medio",
    "Media Picked Sheet Count": "Cantidad de hojas tomadas",
    "Media Sheets Picked": "Hojas tomadas",
    "Media Printed Sheet Count": "Cantidad de hojas impresas",
    "Printed Sheets": "Hojas impresas",
    "Media Sheets Printed": "Hojas impresas por medio",
    "Media Side Count": "Cantidad de caras del medio",
    "Media Picked Side Count": "Cantidad de caras tomadas",
    "Picked Sides": "Caras tomadas",
    "Mono Sides Picked": "Caras monocromáticas tomadas",
    "Color Sides Picked": "Caras a color tomadas",
    "Media Printed Side Count": "Cantidad de caras impresas",
    "Mono Sides Printed": "Caras monocromáticas impresas",
    "Color Sides Printed": "Caras a color impresas",
    "Tiered Coverage Billing": "Facturación por cobertura escalonada",
    "Highlight Color Pages": "Páginas de color destacado",
    "Business Color Pages": "Páginas de color comercial",
    "Graphics Color Pages": "Páginas de color gráfico",
    "Sides by Toner Darkness": "Caras por densidad de tóner",
    "Toner Darkness": "Densidad de tóner",
    "N-Up Information": "Información N-Up",
    "N-Up Number": "Número N-Up",
    "Logical Pages": "Páginas lógicas",
    "Print Speed": "Velocidad de impresión",
    "Pages Per Minute": "Páginas por minuto",
    "Scan Usage": "Uso del escáner",
    "Scanned Sides": "Caras escaneadas",
    "Scanned Sheets": "Hojas escaneadas",
    "Scan-to Destinations": "Destinos de escaneo",
    "Network": "Red",
    "Host": "Host",
    "E-mail": "Correo electrónico",
    "Flatbed": "Cristal",
    "ADF Simplex": "ADF simple faz",
    "ADF Duplex": "ADF dúplex",
    "Environmental Cost Data": "Datos de costo ambiental",
    "ON Time": "Tiempo encendido",
    "Off Time": "Tiempo apagado",
    "Active Time": "Tiempo activo",
    "Idle Time": "Tiempo inactivo",
    "Sleep Time": "Tiempo en suspensión",
    "Warm up total time": "Tiempo total de calentamiento",
    "Supply Information": "Información de insumos",
    "Install Date": "Fecha de instalación",
    "Supply Level": "Nivel del insumo",
    "Capacity": "Capacidad",
    "Sides on Supply": "Caras con el insumo",
    "Return Program": "Programa de retorno",
    "Days Remaining": "Días restantes",
    "Part Number": "Número de parte",
    "Genuine": "Original",
    "Estimated Coverage History": "Historial estimado de cobertura",
    "Last Job": "Último trabajo",
    "Printer Lifetime": "Vida útil de la impresora",
    "Installed Supply": "Insumo instalado",
    "Previous Supply": "Insumo anterior",
    "Model Name": "Nombre del modelo",
    "Serial Number": "Número de serie",
    "Other": "Otro",
    "Total": "Total",
    "Copy": "Copia",
    "Pages": "Páginas",
    "Print": "Impresión",
    "Mono": "Mono",
    "Color": "Color",
}

PHRASE_TRANSLATIONS = [
    ("Printed by ", "Impreso por "),
    ("Jobs by ", "Trabajos por "),
    ("Jobs ", "Trabajos "),
    ("Job ", "Trabajo "),
    ("Average ", "Promedio "),
    ("Avg ", "Prom. "),
    ("document length", "longitud del documento"),
    ("job length", "longitud del trabajo"),
    ("Document Length", "Longitud del documento"),
    ("Job Length", "Longitud del trabajo"),
    ("Job Count", "Cantidad de trabajos"),
    ("Page Count", "Cantidad de páginas"),
    ("Sheet Count", "Cantidad de hojas"),
    ("Side Count", "Cantidad de caras"),
    ("Emulation", "Emulación"),
    ("Information", "Información"),
    ("Number", "Número"),
    ("Count", "Cantidad"),
    ("Length", "Longitud"),
    ("Pages", "Páginas"),
    ("Page", "Página"),
    ("Printed", "Impreso"),
    ("Picked", "Tomadas"),
    ("Scanned", "Escaneadas"),
    ("Supply", "Insumo"),
    ("Sides", "Caras"),
    ("Sheets", "Hojas"),
    ("Flatbed", "Cristal"),
    ("Copy", "Copia"),
    ("Other", "Otro"),
]

def translate(value: str) -> str:
    translated = EXACT_TRANSLATIONS.get(value, value)
    for source, target in PHRASE_TRANSLATIONS:
        translated = translated.replace(source, target)
    translated = re.sub(r"\bLong job\b", "Trabajo largo", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bJob Information\b", "Información del trabajo", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bDevice Statistics\b", "Estadísticas del dispositivo", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bModel Name\b", "Nombre del modelo", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bSerial Number\b", "Número de serie", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bAvg Job\b", "Prom. trabajo", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bJob Count\b", "Cantidad de trabajos", translated, flags=re.IGNORECASE)
    translated = re.sub(r"\bJob Length\b", "Longitud del trabajo", translated, flags=re.IGNORECASE)
    return translated

def render_report(source_html: str) -> str:
    rows = re.findall(
        r"<tr\b[^>]*>\s*(.*?)\s*</tr>",
        source_html,
        re.IGNORECASE | re.DOTALL,
    )
    sections = []
    current_section = None
    current_subsection = None

    for row_html in rows:
        cols = re.findall(
            r"<td\b[^>]*>(.*?)</td>",
            row_html,
            re.IGNORECASE | re.DOTALL,
        )
        if not cols:
            continue

        left_html = cols[0]
        right_html = cols[1] if len(cols) > 1 else ""
        left = strip_tags(left_html)
        right = strip_tags(right_html)

        if not left and not right:
            continue

        is_bold = bool(re.search(r"<b\b", left_html, re.IGNORECASE))
        is_section = is_bold and "size=\"+2\"" in left_html and not right
        is_subsection = is_bold and "size=\"+1\"" in left_html and not right

        if is_section:
            current_section = {"title": translate(left), "subsections": [], "rows": []}
            sections.append(current_section)
            current_subsection = None
            continue

        if is_subsection:
            if current_section is None:
                current_section = {"title": "Reporte", "subsections": [], "rows": []}
                sections.append(current_section)
            current_subsection = {"title": translate(left), "rows": []}
            current_section["subsections"].append(current_subsection)
            continue

        if current_subsection is not None:
            target_rows = current_subsection["rows"]
        elif current_section is not None:
            target_rows = current_section["rows"]
        else:
            current_section = {"title": "Reporte", "subsections": [], "rows": []}
            sections.append(current_section)
            target_rows = current_section["rows"]

        target_rows.append((translate(left), translate(right)))

    if not sections:
        raise SystemExit("Could not parse CX725 report rows")

    parts = ['<div class="report-print">', '<h1>Estadísticas del dispositivo</h1>']
    for section in sections:
        parts.append(f"<section><h2>{html.escape(section['title'])}</h2>")
        if section["rows"]:
            parts.append('<table class="report-table"><tbody>')
            for left, right in section["rows"]:
                parts.append(
                    "<tr>"
                    f"<td class=\"label\">{html.escape(left)}</td>"
                    f"<td class=\"value\">{html.escape(right)}</td>"
                    "</tr>"
                )
            parts.append("</tbody></table>")
        for subsection in section["subsections"]:
            parts.append(f"<h3>{html.escape(subsection['title'])}</h3>")
            parts.append('<table class="report-table"><tbody>')
            for left, right in subsection["rows"]:
                parts.append(
                    "<tr>"
                    f"<td class=\"label\">{html.escape(left)}</td>"
                    f"<td class=\"value\">{html.escape(right)}</td>"
                    "</tr>"
                )
            parts.append("</tbody></table>")
        parts.append("</section>")
    parts.append("</div>")
    return "".join(parts)

model_match = re.search(
    r"Model&nbsp;Name</td><td>\s*(.*?)\s*</td>",
    raw,
    re.IGNORECASE | re.DOTALL,
)
extractor = ReportExtractor()
extractor.feed(raw)
target_html = "".join(extractor.capture).strip()

if not target_html:
    raise SystemExit("Could not find report-container in CX725 report page")

target_html = re.sub(r"<script\b[^>]*>.*?</script>", "", target_html, flags=re.IGNORECASE | re.DOTALL)
target_html = re.sub(r"\sdata-init=\"[^\"]*\"", "", target_html, flags=re.IGNORECASE)
target_html = re.sub(r"\son[a-z]+=\"[^\"]*\"", "", target_html, flags=re.IGNORECASE)
printable_html = render_report(target_html)

fragment_file.write_text(
    """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<base href="{base_url}/">
<style>
@page {{
  size: A4;
  margin: 12mm;
}}
body {{
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background: #fff;
  color: #111;
}}
.report-print {{
  padding: 0;
}}
h1 {{
  margin: 0 0 14px;
  font-size: 24px;
}}
h2 {{
  margin: 22px 0 8px;
  font-size: 20px;
}}
h3 {{
  margin: 16px 0 6px;
  font-size: 16px;
}}
table {{
  width: 100% !important;
  border-collapse: collapse;
  page-break-inside: avoid;
  margin-bottom: 12px;
}}
tr {{
  page-break-inside: avoid;
}}
td {{
  padding: 4px 8px 4px 0;
  vertical-align: top;
  white-space: normal !important;
}}
.label {{
  width: 72%;
}}
.value {{
  width: 28%;
  text-align: right;
  white-space: nowrap !important;
}}
</style>
</head>
<body>
{printable_html}
</body>
</html>
""".format(base_url=base_url, printable_html=printable_html),
    encoding="utf-8",
)

model_match = re.search(
    r"Model(?:&nbsp;|\s)+Name</td><td>\s*(.*?)\s*</td>",
    target_html,
    re.IGNORECASE | re.DOTALL,
)
contact_match = re.search(
    r'<div class="contactName"[^>]*>.*?Contact\s+Name.*?:</span>\s*([^<\n\r]+)\s*</div>',
    raw,
    re.IGNORECASE | re.DOTALL,
)
contact_match = contact_match or re.search(
    r'<div class="contactName"[^>]*>.*?Nombre\s+de\s+contacto.*?:</span>\s*([^<\n\r]+)\s*</div>',
    raw,
    re.IGNORECASE | re.DOTALL,
)
contact_match = contact_match or re.search(
    r"Contact\s+Name\s*</span>\s*<span[^>]*>\s*:\s*</span>\s*([^<\n\r]+)",
    raw,
    re.IGNORECASE | re.DOTALL,
)
serial_match = re.search(
    r"Serial(?:&nbsp;|\s)+Number</td><td>\s*(.*?)\s*</td>",
    target_html,
    re.IGNORECASE | re.DOTALL,
)

model = clean(model_match.group(1) if model_match else f"Printer_{host_suffix}")
serial = clean(contact_match.group(1) if contact_match else "")
if not serial:
    serial = clean(serial_match.group(1) if serial_match else host_suffix)
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
    --no-pdf-header-footer \
    --print-to-pdf="$pdf_tmp" \
    "file://${fragment_file}" >/tmp/cx725_pdf.log 2>&1

cp "$pdf_tmp" "$output_file"

curl -k -fsS \
  -u "${owncloud_user}:${owncloud_pass}" \
  -X MKCOL "${owncloud_base_url}${remote_dir}" >/dev/null 2>&1 || true

curl -k -fsS \
  -u "${owncloud_user}:${owncloud_pass}" \
  -T "$output_file" \
  "${owncloud_base_url}${remote_file}" >/dev/null

printf '%s\n' "${owncloud_base_url}${remote_file}"
