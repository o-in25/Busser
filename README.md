# Busser

![An app for home bar management](https://raw.githubusercontent.com/o-in25/Busser/main/src/lib/assets/logo.png 'App logo')

An app for home bar management.

### Setting Up Cloud SQL Auth Proxy

For local development, service account credentials are required to authenticate with the
[Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/mysql/connect-auth-proxy#troubleshooting).
If you already have the service account JSON locally, you can set it as the default credential by
running `gcloud auth activate-service-account --key-file=service-account.json`. Otherwise, they will
be created with `gcloud auth login`.

You can then start the proxy client with with
`./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --health-check`.

These steps will eventually (maybe) make it into the Dockerfile.

### Running the app

Start the Vite build by running `pnpm run dev`

### Deploying to Fly

To deploy to [Fly](fly.io), run
`fly deploy --build-arg APP_SECRET_1=$APP_SECRET_1 APP_SECRET_2=$APP_SECRET_2 ... ` command with the
relevant app keys/secrets.

Remotely access the deployed machine with `flyctl ssh console -a $APP_NAME`.
