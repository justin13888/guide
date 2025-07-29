# UW Guide

Your guide to UW course planning.

We’ve built a course planning tool designed specifically for University of Waterloo students to simplify the complex process of figuring out which courses they can take, when they can take them, and how they fit into their schedules and degrees.
The app helps users search for courses using advanced filters, explore prereqs, coreqs and antireqs, and get personalized course suggestions based on their academic history. It even supports features like prerequisite path exploration and eligibility checking using SQL triggers — ensuring a student can only add valid course combinations to their plan. To generate the dataset, we scrape data from the undergraduate calendar, and the courses API.

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
