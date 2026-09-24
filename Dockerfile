FROM nodered/node-red:4.1.3-20

USER root

RUN apk update && apk add --no-cache \
    mysql-client \
    build-base \
    python3 \
    chromium \
    cifs-utils \
    make \
    g++ \
    shadow

RUN cd /data && npm install --unsafe-perm --no-update-notifier --no-fund --only=production node-red-node-mysql

RUN usermod -u 1000 node-red && \
    groupmod -g 1000 node-red

RUN mkdir -p /mnt/SERVER06/temp /logs && \
    chown -R 1000:1000 /data /logs /mnt/SERVER06 && \
    chmod -R 775 /logs /mnt/SERVER06

USER node-red
