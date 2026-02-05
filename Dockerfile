# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="SvelteKit"

# Declare build arguments for secrets
ARG DB_HOSTNAME
ARG DB_USER
ARG DB_PASSWORD
ARG DB_PORT
ARG BUCKET
ARG GOOGLE_SERVICE_KEY
ARG OPENAI_API_KEY
ARG INSTANCE_CONNECTION_NAME
ARG JWT_SIGNING_KEY
ARG MAILGUN_KEY
ARG APP_URL
ARG APP_VERSION

# SvelteKit app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=8.15.6
RUN npm install -g pnpm@$PNPM_VERSION

# Install dependencies required for Cloud SQL Auth Proxy
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    wget curl jq ca-certificates && \
    rm -rf /var/lib/apt/lists/*  # Clean up to reduce image size

# Download and install the Cloud SQL Auth Proxy
RUN curl -o /usr/local/bin/cloud_sql_proxy -L "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.15.1/cloud-sql-proxy.linux.amd64" && \
    chmod +x /usr/local/bin/cloud_sql_proxy

# Create a directory for the service account key and sockets
RUN mkdir -p /secrets /cloudsql

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package.json package-lock.json* pnpm-lock.yaml* startup.sh ./
RUN pnpm install --prod=false --no-frozen-lockfile

# Copy application code
COPY . .

# Build application
RUN DB_HOSTNAME=$DB_HOSTNAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT BUCKET=$BUCKET GOOGLE_SERVICE_KEY=$GOOGLE_SERVICE_KEY OPENAI_API_KEY=$OPENAI_API_KEY JWT_SIGNING_KEY=$JWT_SIGNING_KEY MAILGUN_KEY=$MAILGUN_KEY APP_URL=$APP_URL INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME APP_VERSION=$APP_VERSION npm run build
RUN echo "Contents of /app after build:" && ls -al /app


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app

RUN echo "Contents of /app/build after copy:" && ls -al /app/build

# Expose application port
EXPOSE 3000

# Set up service account key storage
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

# Set environment variable for the service account key location
ENV GOOGLE_APPLICATION_CREDENTIALS="/secrets/service-account.json"

# Run Cloud SQL Proxy before starting the app
CMD /startup.sh