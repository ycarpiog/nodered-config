import fs from 'node:fs/promises';
import path from 'node:path';
import * as pdfjsLib from '/data/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const monthMap = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};
const MAX_DETAILS = 20;

function pushLimited(list, value) {
  if (list.length < MAX_DETAILS) list.push(value);
}

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

async function detectFecha(filePath) {
  const data = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  try {
    const dateRegex = /\b(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})\b/g;
    const fechaRegex = /FECHA\s*:?\s*([^\n]{0,80})/ig;
    const fechaLongRegex = /FECHA\s*:?\s*(\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+de\s+\d{4})/ig;

    let firstFecha = null;
    let firstGeneric = null;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => ('str' in item ? item.str : '')).filter(Boolean).join(' ');

      if (!firstFecha) {
        for (const match of text.matchAll(fechaLongRegex)) {
          const normalized = normalizeLabeledDate(match[1]);
          if (normalized) {
            firstFecha = normalized;
            break;
          }
        }
      }
      if (!firstFecha) {
        for (const match of text.matchAll(fechaRegex)) {
          const normalized = normalizeLabeledDate(match[1]);
          if (normalized) {
            firstFecha = normalized;
            break;
          }
        }
      }
      if (!firstGeneric) {
        const generic = text.match(dateRegex);
        if (generic && generic[0]) {
          firstGeneric = generic[0].replace(/[\/-]/g, '.');
        }
      }
      if (firstFecha || firstGeneric) break;
    }

    return firstFecha || firstGeneric || null;
  } finally {
    await pdf.destroy();
  }
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error(JSON.stringify({ error: 'Missing directory argument' }));
    process.exit(1);
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const pdfs = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));

  const summary = {
    directory: dir,
    totalFound: pdfs.length,
    movedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    moved: [],
    skipped: [],
    errors: []
  };

  for (const file of pdfs) {
    try {
      const fecha = await detectFecha(file);
      if (!fecha) {
        summary.skippedCount += 1;
        pushLimited(summary.skipped, { file, reason: 'date_not_found' });
        continue;
      }

      const [day, month, year] = fecha.split('.');
      if (!day || !month || !year) {
        summary.skippedCount += 1;
        pushLimited(summary.skipped, { file, reason: 'invalid_date_format', fecha });
        continue;
      }

      const targetDir = path.join(dir, year, month);
      const targetFile = path.join(targetDir, path.basename(file));

      if (path.dirname(file) === targetDir) {
        summary.skippedCount += 1;
        pushLimited(summary.skipped, { file, reason: 'already_in_target', fecha, targetDir });
        continue;
      }

      await fs.mkdir(targetDir, { recursive: true, mode: 0o777 });
      await fs.rename(file, targetFile);
      summary.movedCount += 1;
      pushLimited(summary.moved, { file, targetFile, fecha });
    } catch (error) {
      summary.errorCount += 1;
      pushLimited(summary.errors, { file, error: error.message });
    }
  }

  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
});
