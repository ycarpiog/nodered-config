# `generate_cx725_pdf.sh`

Genera el PDF del reporte `Device Statistics` para la impresora `192.168.3.230` y otras del mismo tipo.

## Ubicacion

- Host: `config/lib/generate_cx725_pdf/generate_cx725_pdf.sh`
- Contenedor Node-RED: `/data/lib/generate_cx725_pdf/generate_cx725_pdf.sh`

## Uso

Recibe como argumento el ultimo octeto de la IP:

```sh
/data/lib/generate_cx725_pdf/generate_cx725_pdf.sh 230
```

## Como funciona

1. Abre en Chromium headless la ruta:
   `http://192.168.3.X/#/Settings/Reports/ReportDeviceStatisticsPopup`
2. Extrae del DOM `Model Name` y `Serial Number`.
3. Usa solo los ultimos 5 caracteres del serial.
4. Genera el PDF y lo guarda en:
   `/data/temp/CX725/YYYY_MM_DD/`
5. Sube una copia a OwnCloud en:
   `OWNCLOUD_PRINTERS_PATH/YYYY_MM_DD/`

## Variables requeridas

- `OWNCLOUD_BASE_URL`
- `OWNCLOUD_USER`
- `OWNCLOUD_PASSWORD`
- `OWNCLOUD_PRINTERS_PATH`

## Salida

Imprime por stdout la URL final del PDF subido a OwnCloud.
