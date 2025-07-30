# UW Guide

Your guide to UW course planning.

We’ve built a course planning tool designed specifically for University of Waterloo students to simplify the complex process of figuring out which courses they can take, when they can take them, and how they fit into their schedules and degrees.
The app helps users search for courses using advanced filters, explore prereqs, coreqs and antireqs, and get personalized course suggestions based on their academic history. It even supports features like prerequisite path exploration and eligibility checking using SQL triggers — ensuring a student can only add valid course combinations to their plan. To generate the dataset, we scrape data from the undergraduate calendar, and the courses API.

## Features

**5 Basic Features**

1. Course Department Statistics - Display count of courses grouped by department for overview of course distributio
2. Course Filtering by Term and Level - Filter courses by availability (fall/winter/spring) and course level (100s, 200s, etc.)
3. Course Leads to Display - This feature displays courses that have the user-selected course as a prerequisite (ie. which courses a course “leads to”). 
4. Antirequisite Display - This feature displays which courses have the user-selected course as an antirequisite.
5. Academic Load Validation - Check if a student's course load per term exceeds limits (max 7 courses for regular terms, 0.5 units for work terms)

**5 Advanced Features**

1. Prerequisite Path Visualization - Display prerequisite chains with path visualization for complex course dependencies
2. Course Recommendation Engine - Suggest courses based on completed prerequisites by analyzing the prerequisite tree backwards from taken courses
3. Course Validator - Validate prerequisite satisfaction considering complex AND/OR logic in prerequisite trees. It will check the user’s eligibility to take the courses they have specified in their course schedule depending on if they have completed the prereqs.
4. Course Importer script - This feature is the insertion portion of the course importer script. It hits the UW OpenData API, gets all the courses and their related data, transforms it, and then loads it into the database.
5. Course Validator with term ordering and antire check - It checks if the user is planning a valid course schedule depending on if all the prereqs for a course are planned to be taken before the course, and lets the user know if they're taking any antirequisites.

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
