# UW Guide - Project Structure Documentation

## Overview

UW Guide is a course planning application for University of Waterloo students. It's built with TypeScript, uses PostgreSQL on the backend, and includes features like course search, prerequisite validation, and academic planning tools.

## Root Directory Structure

```
didactic-octo-rotary-phone/
├── ddls/                    # Database schema definitions
├── drizzle/                 # Database migrations and schema files
├── feature-tests/           # SQL performance tests and feature validation
├── public/                  # Static assets
├── scripts/                 # Data import and seeding scripts
├── src/                     # Main application source code
├── docker-compose.yml       # Development environment setup
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Project dependencies and scripts
└── README.md               # Project overview and setup instructions
```

## Directory Details

### 📁 `ddls/` - Database Schema Definitions

- **Purpose**: Contains the database schema definition
- **Key Files**:
  - `2025-06-17.sql` - Main database schema with all table definitions
  - `2025-07-29.sql` - Main database schema with all the updated table definitions
- **Usage**: Reference for understanding the complete database structure

### 📁 `drizzle/` - Database Migrations & Schema

- **Purpose**: Drizzle ORM migrations and schema management
- **Key Files**:
  - `schema.ts` - TypeScript schema definitions
  - `relations.ts` - Database relationship definitions
  - `0000_brainy_ezekiel_stane.sql` through `0007_romantic_black_widow.sql` - Migration files
  - `meta/` - Migration metadata and snapshots
- **Usage**: Database schema evolution and version control

### 📁 `feature-tests/` - SQL Performance & Feature Testing

- **Purpose**: Performance testing and feature validation queries
- **Key Files**:
  - `test-sample.sql` - Sample feature tests
  - `test-production.sql` - Production feature tests
  - `r15-performance-timings.sql` - Performance benchmarking for complex queries
  - `performance-timings-template.sql` - Template for performance testing
- **Usage**: Validate features and measure query performance

### 📁 `public/` - Static Assets

- **Purpose**: Publicly accessible static files
- **Key Files**:
  - `ER_Diagram.png` - Database entity relationship diagram
  - `favicon.ico` - Application favicon
- **Usage**: Static assets served directly by Next.js

### 📁 `scripts/` - Data Management Scripts

- **Purpose**: Database seeding and data import utilities
- **Subdirectories**:
  - `import-courses/` - Scripts to import course data from UWaterloo API
  - `seed/` - Database seeding scripts for development
- **Usage**: Populate database with course data and development fixtures

### 📁 `src/` - Main Application Source Code

#### `src/app/` - Next.js App Router

- **Purpose**: Next.js 13+ app directory structure
- **Key Directories**:
  - `_components/` - Shared UI components
  - `api/` - API route handlers
  - `tree/` - Course tree visualization pages
  - `prereqs/` - Prerequisite-related pages
  - `prerequisite-paths/` - Prerequisite path exploration pages
- **Key Files**:
  - `layout.tsx` - Root layout component
  - `page.tsx` - Home page component

#### `src/server/` - Server-Side Code

- **Purpose**: Backend logic, database operations, and API handlers
- **Key Directories**:
  - `api/` - tRPC API routers and procedures
  - `auth/` - Authentication configuration
  - `db/` - Database connection and schema
- **Key Files**:
  - `constants.ts` - Application constants and configurations

#### `src/models/` - Data Models

- **Purpose**: TypeScript interfaces and data models
- **Usage**: Type definitions for courses, requirements, etc.

#### `src/trpc/` - tRPC Configuration

- **Purpose**: tRPC client and server setup
- **Usage**: Type-safe API communication between client and server

#### `src/styles/` - Styling

- **Purpose**: Global CSS and styling configurations
- **Usage**: Application-wide styles and Tailwind CSS configuration

#### `src/test/` - Testing

- **Purpose**: Test files and testing configuration
- **Usage**: Unit tests, integration tests, and test utilities

#### `src/env.js` - Environment Configuration

- **Purpose**: Environment variable validation and configuration
- **Usage**: Type-safe environment variable handling

## Key Configuration Files

### `package.json`

- **Dependencies**: Next.js, React, tRPC, Drizzle ORM, D3.js, Konva
- **Scripts**: Development, testing, database operations, and data import
- **Package Manager**: pnpm

### `drizzle.config.ts`

- **Purpose**: Drizzle ORM configuration
- **Schema Location**: `./src/server/db/schema.ts`
- **Output Directory**: `./drizzle`
- **Database**: PostgreSQL

### `docker-compose.yml`

- **Purpose**: Development environment setup
- **Services**: PostgreSQL database for development

## Development Workflow

### 1. Setup

```bash
pnpm install
docker compose up
pnpm run db:push
```

### 2. Data Population

```bash
# For development (sample data)
pnpm seed

# For production (real course data)
pnpm import-courses --clear
```

### 3. Development

```bash
pnpm dev
```

### 4. Testing

```bash
pnpm test
pnpm test:coverage
```

### 5. Database Operations

```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
```

## Architecture Patterns

### Frontend

- **Framework**: Next.js 13+ with App Router
- **UI Library**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: tRPC for server state, React Query for caching
- **Visualization**: D3.js and Konva for course trees and diagrams

### Backend

- **API**: tRPC for type-safe APIs
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Validation**: Zod schemas

### Database

- **Database**: PostgreSQL
- **Migrations**: Version-controlled schema changes
- **Relations**: Complex prerequisite trees with AND/OR logic
- **Performance**: Optimized indices for complex queries

## Key Features

1. **Course Search & Filtering**: Advanced course discovery with multiple filters
2. **Prerequisite Validation**: Complex tree-based prerequisite checking
3. **Academic Planning**: Term-based course planning with validation
4. **Visual Course Trees**: Interactive prerequisite path visualization
5. **Performance Optimization**: Indexed queries for complex prerequisite validation

## Performance Considerations

- Complex prerequisite validation queries are optimized with strategic indices
- Performance testing scripts in `feature-tests/` validate query efficiency
- Database indices are carefully designed for the most common query patterns
- tRPC provides type safety and efficient client-server communication

This structure supports a scalable, maintainable course planning application with robust database operations and excellent developer experience.
