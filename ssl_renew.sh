#!/bin/bash
# renew SSL certificate
COMPOSE="/usr/local/bin/docker-compose --no-ansi"
DOCKER="/usr/bin/docker"

cd /root/shortlink/
$COMPOSE run certbot renew && $COMPOSE kill -s SIGHUP nginx
$DOCKER system prune -af