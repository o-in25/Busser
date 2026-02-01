# Busser

![An app for home bar management](https://storage.googleapis.com/busser/assets/logo-nav.png 'App logo')

A modern web application for managing your home bar. Track your inventory, discover cocktails you
can make with what you have, and share your bar with friends and family.

**Live at:** https://busserapp.com

## Features

- **Inventory Management** - Track your bottles, spirits, mixers, and garnishes with stock levels
  and categories
- **Cocktail Catalog** - Browse and search recipes organized by base spirit
- **Smart Recommendations** - See which cocktails you can make based on your current inventory
- **Workspaces** - Create dedicated spaces for your bar with their own inventory and recipes
- **Collaboration** - Invite others to your workspace as owners, editors, or viewers
- **AI-Powered** - Generate cocktail images and get recipe suggestions

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Access to Cloud SQL instance (or local MySQL)

### Local Database Setup

Service account credentials are required to authenticate with the
[Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/mysql/connect-auth-proxy#troubleshooting).

1. Set credentials: `gcloud auth activate-service-account --key-file=service-account.json`
2. Start proxy: `./cloud-sql-proxy $INSTANCE_CONNECTION_NAME --health-check`

### Running the App

```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server at http://localhost:5173
pnpm run check      # TypeScript validation
pnpm run build      # Production build
pnpm run preview    # Preview production build
```

### Environment Variables

| Variable                   | Description             |
| -------------------------- | ----------------------- |
| `DB_HOSTNAME`              | Database host           |
| `DB_USER`                  | Database user           |
| `DB_PASSWORD`              | Database password       |
| `DB_PORT`                  | Database port           |
| `JWT_SIGNING_KEY`          | Secret for JWT signing  |
| `GOOGLE_SERVICE_KEY`       | GCP service account key |
| `BUCKET`                   | GCS bucket name         |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance      |
| `OPENAI_API_KEY`           | OpenAI API key          |
| `MAILGUN_KEY`              | Mailgun API key         |

## Deployment

Deploy to [Fly.io](https://fly.io):

```bash
fly deploy --build-arg APP_SECRET_1=$APP_SECRET_1 APP_SECRET_2=$APP_SECRET_2 ...
```

Access the deployed machine:

```bash
flyctl ssh console -a $APP_NAME
```
