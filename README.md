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

# Fetch course data
pnpm fetch-courses

# Start dev server
pnpm dev
# Open http://localhost:3000
```

<!-- TODO: Add LICENSE -->
