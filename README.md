# UW Guide

Your guide to UW course planning

## Development

### Prerequisites

- Node.js and pnpm (via fnm is recommended)

### Running

```sh
pnpm install

# Spin up dev PostgreSQL server (and other dependencies)
docker compose up

# Initialize Drizzle schema
pnpm run db:push

# Populate the database with course data (choose one option):
# Option 1: Seed with sample data (small set of example courses for development)
pnpm seed
# OR
# Option 2: Import real course data from UWaterloo API (comprehensive dataset)
pnpm import-courses --clear

# Start dev server
pnpm dev
# Open http://localhost:3000
```

<!-- TODO: Add LICENSE -->
