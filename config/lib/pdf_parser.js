// /data/lib/pdf_parser.js
// Extrae texto, metadatos y estructura básica del PDF

const pdfParse = require('pdf-parse');

async function extractPDFData(pdfBuffer) {
    if (!Buffer.isBuffer(pdfBuffer)) throw new Error("El parámetro debe ser un Buffer");

    const data = await pdfParse(pdfBuffer);

    const pages = data.text
        .split(/\f|\n\s*\n/g)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const info = data.info || {};
    const metadata = data.metadata ? data.metadata._metadata : {};

    return {
        numPages: data.numpages || 0,
        version: data.version || '',
        info: {
            title: info.Title || null,
            author: info.Author || null,
            subject: info.Subject || null,
            producer: info.Producer || null,
            creator: info.Creator || null,
            creationDate: info.CreationDate || null,
            modDate: info.ModDate || null
        },
        metadata,
        text: data.text,
        pages
    };
}

module.exports = { extractPDFData };
