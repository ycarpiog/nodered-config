import fs from 'node:fs';
import * as pdfjsLib from '/data/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Missing PDF path');
  process.exit(1);
}

const data = new Uint8Array(fs.readFileSync(filePath));
const loadingTask = pdfjsLib.getDocument({ data });
const pdf = await loadingTask.promise;

let meta = null;
try {
  meta = await pdf.getMetadata();
} catch (error) {
  meta = null;
}

const info = meta?.info || {};
const metadata = meta?.metadata?.getAll?.() || null;

console.log(JSON.stringify({
  file: filePath,
  numPages: pdf.numPages,
  info,
  metadata
}));
