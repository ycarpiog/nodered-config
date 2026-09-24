# Node-RED Docker

Proyecto Node-RED desplegado con Docker Compose, configuracion versionada y secretos manejados por variables de entorno.

Repositorio actual:
- `git@github.com:ycarpiog/nodered_docker.git`

Version base etiquetada:
- `v1.0.0-telegram-bot`

## Objetivo del proyecto

Este proyecto levanta una instancia de Node-RED en Docker con:
- configuracion principal versionada en `config/`
- despliegue por HTTPS
- bot principal de Telegram integrado en los flows
- exportacion de reportes Excel desde Node-RED
- runtime aislado y listo para continuar evolucionando

## Estructura

```text
/opt/nodered_docker
|-- Dockerfile
|-- docker-compose.yml
|-- .env
|-- .envexample
|-- README.MD
|-- config/
|   |-- flows.json
|   |-- flows_cred.json
|   |-- settings.js
|   |-- certs/
|   `-- lib/
|-- data/
|   |-- package.json
|   |-- package-lock.json
|   |-- public/
|   `-- node_modules/
`-- logs/
```

## Que se versiona

Se sube a git:
- `Dockerfile`
- `docker-compose.yml`
- `.envexample`
- `README.MD`
- `config/flows.json`
- `config/settings.js`
- `config/lib/*`
- `data/package.json`
- `data/package-lock.json`
- `data/public/*`

No se sube a git:
- `.env`
- `config/flows_cred.json`
- `config/certs/*`
- `logs/`
- archivos temporales y cache del runtime
- tokens, claves, passwords y secretos operativos

## Requisitos

- Docker
- Docker Compose plugin
- Acceso a red hacia las bases de datos y servicios externos usados por los flows
- Si aplica, montajes SMB ya resueltos en el host

## Variables de entorno

1. Crear `.env` desde la plantilla:

```bash
cp .envexample .env
```

2. Completar credenciales, rutas, tokens y parametros.

Variables importantes:
- `NODERED_ENABLE_HTTPS=true`
- `NODERED_CREDENTIAL_SECRET=`
- `NODERED_USERNAME_1=`
- `NODERED_PASSWORD_HASH_1=`
- `TELEGRAM_BOT_ENABLED=true`
- `TELEGRAM_BOT_USER=`
- `TELEGRAM_BOT_TOKEN=`
- `TOMS_BOT_ENABLED=false`
- `TEMP_PATH=`

## Password admin

El login admin del editor se define por entorno.

Usuario:
- `NODERED_USERNAME_1`

Password:
- se guarda como hash bcrypt en `NODERED_PASSWORD_HASH_1`

Para generar un hash bcrypt:

```bash
node -e "console.log(require('bcryptjs').hashSync('TuPassword', 12))"
```

Si el hash contiene `$`, en `.env` debe guardarse como `$$`.

## HTTPS

La instancia esta preparada para responder por HTTPS en `1880`.

Archivos esperados:
- `config/certs/server.crt`
- `config/certs/server.key`

Si necesitas un certificado autofirmado:

```bash
mkdir -p config/certs
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout config/certs/server.key \
  -out config/certs/server.crt \
  -days 825 \
  -subj '/CN=192.168.3.104'
```

Prueba local:

```bash
curl -k -I https://127.0.0.1:1880/
```

## Levantar el proyecto

Construir y levantar:

```bash
docker compose up -d --build
```

Ver estado:

```bash
docker ps --filter name=nodered
docker logs -f nodered
```

Acceso web:

```text
https://IP_DEL_SERVIDOR:1880/
```

## Flujos y configuracion

Fuente principal:
- `config/flows.json`

Configuracion del runtime:
- `config/settings.js`

Credenciales internas de Node-RED:
- `config/flows_cred.json`

Directorio `data/`:
- dependencias instaladas
- contenido publico
- runtime auxiliar
- librerias adicionales usadas por los flows

## Bot de Telegram

El proyecto incluye un bot principal de Telegram en el tab:
- `Telegram Control Troms Bots`

Comportamiento funcional actual:
- autoriza solo al usuario con id `5888154022`
- muestra botones inline dentro del mensaje
- comando `Get_Op_Info`
- comando `Get_Error_List`
- genera Excel para resultados de OP
- genera Excel para listado de errores
- permite continuar con otra OP o despedirse al salir

### Get_Op_Info

Reglas:
- solo usuario autorizado
- la OP debe tener formato `SO #1278316375`
- longitud total exacta: `14` caracteres

Si no cumple:
- responde indicando requisito `1`, `2` o ambos

Si cumple:
- envia mensaje de procesamiento
- ejecuta consulta SQL por `TBOP`
- si encuentra datos, genera Excel
- si no encuentra datos, responde que la OP no fue encontrada
- luego pregunta si desea introducir otra OP
- si pulsa `No`, envia despedida y termina

Consulta usada:

```sql
SELECT
    PDANombreCliente as "Nombre",
    TBNumeroDocCliente as "ID",
    TBProceso as "Proceso",
    TBProducto as "Producto",
    TBIMEI as "IMEI"
FROM
    TareasBot
    INNER JOIN PedidosDatosAnexos
        ON PedidosDatosAnexos.PDAOp = TareasBot.TBOP
        AND PedidosDatosAnexos.PDACliente = TareasBOT.TBCliente
WHERE
    TBOP = ?
ORDER BY
    TBFechaProcesado Asc
```

### Get_Error_List

Comportamiento:
- envia mensaje de procesamiento
- ejecuta consulta de errores
- genera Excel
- envia mensaje final y termina

Consulta usada:

```sql
SELECT
    RegOP AS "OP",
    RegNDB as "Proceso",
    RegDate as "Fecha",
    RegLog as "Logs",
    RegEstado as "Estado"
FROM
    Registro
WHERE
    RegEstado IN ('ERROR')
    AND RegNDB IN ('VALIDADOS','SERIES','ACTIVACION')
    AND DATEDIFF(DAY,RegDate,SYSDATETIME()) <= 7
```

## Formato de Excel

Los Excel se generan con `exceljs` desde nodos `function`.

Criterios actuales:
- nombre del archivo igual al valor funcional esperado
- hoja principal con nombre funcional esperado
- encabezado azul claro
- filas alternadas azul claro y blanco
- ancho de columnas ajustado al contenido
- filas ajustadas para mejorar lectura

Para `Get_Op_Info`:
- archivo: nombre de la OP
- hoja: nombre de la OP

Para `Get_Error_List`:
- archivo: `Errores_Pendientes.xlsx`
- hoja: `Errores_Pendientes`

## Montajes SMB

Si el proyecto depende de recursos CIFS/SMB, el montaje se hace en el host, no dentro del contenedor.

Instalar soporte:

```bash
sudo apt update
sudo apt install -y cifs-utils
```

Crear punto de montaje:

```bash
sudo mkdir -p /mnt/SERVER06
```

Crear archivo de credenciales fuera del repo:

```bash
sudo nano /root/.smbcredentials-server06
```

Contenido:

```text
username=USUARIO
password=PASSWORD
```

Permisos:

```bash
sudo chmod 600 /root/.smbcredentials-server06
```

Montaje ejemplo:

```bash
sudo mount -t cifs //192.168.3.6/Sistemas /mnt/SERVER06 \
  -o credentials=/root/.smbcredentials-server06,uid=1000,gid=1000,dir_mode=0775,file_mode=0775
```

Si aparece `permission denied (are you root?)`, falta `sudo` o privilegios de root.

## Restore rapido

1. Clonar el repositorio.
2. Crear `.env` desde `.envexample`.
3. Restaurar certificados en `config/certs/`.
4. Restaurar `config/flows_cred.json` si aplica.
5. Verificar variables de entorno.
6. Levantar el proyecto.

```bash
git clone git@github.com:ycarpiog/nodered_docker.git
cd nodered_docker
cp .envexample .env
docker compose up -d --build
```

## Backup recomendado

Guardar antes de cambios grandes:
- `.env`
- `config/flows.json`
- `config/flows_cred.json`
- `config/settings.js`
- `config/certs/`

Ejemplo:

```bash
tar -czf nodered_backup_$(date +%F_%H%M%S).tar.gz \
  .env config/flows.json config/flows_cred.json config/settings.js config/certs
```

## Operacion diaria

Reiniciar:

```bash
docker compose restart nodered
```

Detener:

```bash
docker compose down
```

Reconstruir:

```bash
docker compose up -d --build --force-recreate
```

Ver logs:

```bash
docker logs -f nodered
```

## Git

Remote actual:

```bash
git@github.com:ycarpiog/nodered_docker.git
```

Flujo basico:

```bash
git status
git add .
git commit -m "Describe el cambio"
git push origin main
```

Tag base actual:

```bash
v1.0.0-telegram-bot
```

## Notas de seguridad

- No guardar secretos dentro de `flows.json`
- Mantener `.env` fuera de git
- Mantener `config/flows_cred.json` fuera de git
- Usar SSH para `git push`
- Rotar credenciales si alguna fue expuesta
- Mantener desactivados bots no usados por entorno
