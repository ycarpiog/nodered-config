# Changelog

Todas las mejoras relevantes del proyecto se registran en este archivo.

## v1.0.0-telegram-bot - 2026-03-20

### Added
- Despliegue principal de Node-RED en Docker bajo `/opt/nodered_docker`
- Configuracion principal versionada en `config/`
- HTTPS habilitado en la instancia principal
- Bot principal de Telegram integrado en el tab `Telegram Control Troms Bots`
- Menus inline dentro del mensaje para comandos y continuacion
- Flujo `Get_Op_Info`
- Flujo `Get_Error_List`
- Exportacion Excel con `exceljs`
- Tag de version `v1.0.0-telegram-bot`
- `README.MD` actualizado con la documentacion operativa del proyecto

### Changed
- Migracion del proyecto antiguo a la estructura principal `nodered_docker`
- Flujos reorganizados por bloques funcionales para facilitar escalabilidad
- Validacion de OP ajustada al formato `SO #1278316375`
- Comportamiento de salida de `Get_Op_Info` actualizado para despedirse al pulsar `No`
- Generacion de Excel ajustada para mejorar lectura visual de columnas y filas

### Fixed
- Eliminacion de credenciales sensibles hardcodeadas del flow principal
- Conservacion de `chatId`, `userName` y contexto funcional despues de consultas SQL
- Correccion de errores de envio de Telegram por `chat_id is empty`
- Correccion del cierre del menu cuando el usuario selecciona `No`
- Correccion de errores de contexto invalido en los flows de Telegram
- Correccion del layout de persistencia de `flows.json` para evitar errores `EBUSY`

### Security
- Secretos y usuarios movidos a variables de entorno
- `credentialSecret` gestionado por entorno
- Permisos restringidos sobre archivos sensibles
- SSH configurado para operar con GitHub sin token en texto plano

### Notes
- Siguen existiendo warnings de bots secundarios sin token:
  - `telefonica_tomsbot`
  - `PLNetAlert`
- No afectan el bot principal documentado en esta version
