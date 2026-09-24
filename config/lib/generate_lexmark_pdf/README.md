# `generate_lexmark_pdf.sh`

Genera el PDF de contadores de una impresora Lexmark, guarda una copia local y sube otra copia a OwnCloud.

## Ubicacion

- Host: `config/lib/generate_lexmark_pdf/generate_lexmark_pdf.sh`
- Contenedor Node-RED: `/data/lib/generate_lexmark_pdf/generate_lexmark_pdf.sh`

## Uso

Recibe como argumento el ultimo octeto de la IP:

```sh
/data/lib/generate_lexmark_pdf/generate_lexmark_pdf.sh 225
```

Con ese valor consulta:

```text
http://192.168.3.225/cgi-bin/dynamic/printer/config/reports/devicestatistics.html
```

## Que hace

1. Descarga la pagina de estadisticas de la impresora.
2. Extrae `Nombre de modelo` y `Numero de serie`.
3. Usa solo los ultimos 5 caracteres del numero de serie.
4. Genera un PDF con nombre `Modelo_serie.pdf`.
5. Guarda una copia local en:
   `/data/temp/Lexmark/YYYY_MM_DD/`
6. Sube otra copia a OwnCloud en:
   `OWNCLOUD_PRINTERS_PATH/YYYY_MM_DD/`

## Variables requeridas

Las toma desde el `.env` del proyecto:

- `OWNCLOUD_BASE_URL`
- `OWNCLOUD_USER`
- `OWNCLOUD_PASSWORD`
- `OWNCLOUD_PRINTERS_PATH`

## Salida

Imprime por stdout la URL final del archivo subido a OwnCloud.
