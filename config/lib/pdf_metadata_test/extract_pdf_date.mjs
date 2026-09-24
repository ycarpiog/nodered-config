import fs from 'node:fs';
import * as pdfjsLib from '/data/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Missing PDF path');
  process.exit(1);
}

const monthMap = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

function normalizeLabeledDate(value) {
  if (!value) return null;
  const compact = value.replace(/\s+/g, ' ').trim();
  const numeric = compact.match(/(\d{2})[.\/\-](\d{2})[.\/\-](\d{4})/);
  if (numeric) return `${numeric[1]}.${numeric[2]}.${numeric[3]}`;

  const long = compact.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+de\s+(\d{4})/i);
  if (long) {
    const day = long[1].padStart(2, '0');
    const month = monthMap[long[2].toLowerCase()];
    if (month) return `${day}.${month}.${long[3]}`;
  }
  return null;
}

const data = new Uint8Array(fs.readFileSync(filePath));
const loadingTask = pdfjsLib.getDocument({ data });
const pdf = await loadingTask.promise;

const dateRegex = /\b(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})\b/g;
const fechaRegex = /FECHA\s*:?\s*([^\n]{0,80})/ig;
const fechaLongRegex = /FECHA\s*:?\s*(\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+de\s+\d{4})/ig;

const matches = [];
const fechaMatches = [];
const preview = [];

for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  const pieces = textContent.items
    .map((item) => ('str' in item ? item.str : ''))
    .filter(Boolean);
  const text = pieces.join(' ');
  preview.push({ page: pageNum, text: text.slice(0, 500) });

  for (const match of text.matchAll(fechaLongRegex)) {
    const normalized = normalizeLabeledDate(match[1]);
    fechaMatches.push({ page: pageNum, raw: match[1], normalized });
  }
  for (const match of text.matchAll(fechaRegex)) {
    const normalized = normalizeLabeledDate(match[1]);
    if (normalized) fechaMatches.push({ page: pageNum, raw: match[1], normalized });
  }
  for (const match of text.matchAll(dateRegex)) {
    matches.push({ page: pageNum, value: match[1].replace(/[\/-]/g, '.') });
  }
}

const uniqueFecha = [];
for (const item of fechaMatches) {
  if (item.normalized && !uniqueFecha.find((x) => x.normalized === item.normalized)) {
    uniqueFecha.push(item);
  }
}

const uniqueDates = [];
for (const item of matches) {
  if (!uniqueDates.find((x) => x.value === item.value)) {
    uniqueDates.push(item);
  }
}

console.log(JSON.stringify({
  file: filePath,
  numPages: pdf.numPages,
  detectedFecha: uniqueFecha[0]?.normalized || uniqueDates[0]?.value || null,
  fechaMatches: uniqueFecha,
  matches: uniqueDates,
  preview
}));
