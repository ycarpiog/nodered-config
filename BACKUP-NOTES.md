# Node-RED configuration repository

This repository starts with a snapshot of the local Node-RED deployment as of 2026-09-24. It has a new Git history.

Runtime `.env` files, Node-RED credential files, certificates, databases, logs, customer spreadsheets, and dated local backups are excluded. The fallback admin password hash in `config/settings.js`, mail tokens in `config/flows.json`, and one API key in a Function node were removed. Configure `EXTERNAL_APP_API_KEY` and other credentials locally before deploying.
