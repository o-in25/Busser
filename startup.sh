#!/bin/sh

# Decode the base64 service account key and store it in a file
echo "$GOOGLE_SERVICE_KEY" | base64 -d > /secrets/service-account.json

# Start the Cloud SQL Auth Proxy
cloud_sql_proxy --port 3306 --credentials-file /secrets/service-account.json "$INSTANCE_CONNECTION_NAME" &

# Start the application
exec node ./build/index.js
