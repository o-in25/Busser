# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="SvelteKit"

# Declare build arguments for secrets
ARG HOSTNAME
ARG USER
ARG PASSWORD
ARG PORT
ARG BUCKET
ARG GOOGLE_SERVICE_KEY
ARG OPENAI_API_KEY


# SvelteKit app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=8.15.6
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json pnpm-lock.yaml ./
RUN npm install --prod=false

# Copy application code
COPY . .

# Build application
RUN HOSTNAME=$HOSTNAME USER=$USER PASSWORD=$PASSWORD PORT=$PORT BUCKET=$BUCKET GOOGLE_SERVICE_KEY=$GOOGLE_SERVICE_KEY OPENAI_API_KEY=$OPENAI_API_KEY npm run build

# Remove development dependencies
RUN pnpm prune --prod


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "./build/index.js" ]
