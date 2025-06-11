This script calls the UW OpenData API to fetch course information.

We then transform the data and load it into the database.

API docs URL: https://openapi.data.uwaterloo.ca/api-docs/index.html

## File Structure

The script follows the ETL (Extract, Transform, Load) pipeline pattern:

### **Extract Phase**

- **`step1-fetch-course-data.ts`** - Extract raw course data from UW OpenData API
- **`step2-determine-term-offerings.ts`** - Extract term offering information by cross-referencing schedule data

### **Transform Phase**

- **`step3-parse-requirements.ts`** - Transform requirements description into structured data

### **Load Phase**

- **`step4-insert-database.ts`** - Load transformed data into database

### **Orchestration**

- **`main.ts`** - Main orchestrator that executes the complete ETL pipeline

## Architecture Overview

The pipeline follows the standard ETL pattern:

```
Extract: API Data → step1 → step2
Transform: step3 (parse requirements)
Load: step4 → Database
```

Each phase has a specific responsibility:

- **Extract**: Gather raw data from external sources
- **Transform**: Convert data into the required format
- **Load**: Insert processed data into the target system

## Usage

### Quick Start

```bash
# Import all courses into the database
pnpm run import-courses

# Clear existing data and import all courses
pnpm run import-courses --clear

# Test with a small subset (5 courses)
pnpm run test-insertion

# Import with custom options
pnpm run import-courses --clear --save --batch-size=100 --max-courses=50
```

### Command Line Options

- `--clear`: Clear existing course data before import
- `--save`: Save transformed data to file for inspection
- `--batch-size=N`: Set batch size for database insertion (default: 50)
- `--max-courses=N`: Limit number of courses to import (for testing)
- `--help, -h`: Show help message

### Examples

```bash
# Import all courses
pnpm run import-courses

# Fresh import (clear existing data)
pnpm run import-courses --clear

# Test with limited courses
pnpm run import-courses --max-courses=10

# Use larger batch size for faster import
pnpm run import-courses --batch-size=100

# Save transformed data for debugging
pnpm run import-courses --save
```

## Extract Phase

### Step 1: Fetching course data

We call the API route to get data about each course. The schema is:

```json
[
  {
    "courseId": "string",
    "courseOfferNumber": 0,
    "termCode": "string",
    "termName": "string",
    "associatedAcademicCareer": "string",
    "associatedAcademicGroupCode": "string",
    "associatedAcademicOrgCode": "string",
    "subjectCode": "string",
    "catalogNumber": "string",
    "title": "string",
    "descriptionAbbreviated": "string",
    "description": "string",
    "gradingBasis": "string",
    "courseComponentCode": "string",
    "enrollConsentCode": "string",
    "enrollConsentDescription": "string",
    "dropConsentCode": "string",
    "dropConsentDescription": "string",
    "requirementsDescription": "string"
  }
]
```

### Step 2: Determine term offerings

We call the API with 3 term codes (1249 for Fall 2024, 1251 for Winter 2025, and 1255 for Spring 2025) to get a list of courseIDs of the courses that are offered every term. We then go through the courses from Step 1, cross-referencing with the 3 lists.

**Output**: Raw course data enriched with term offering information.

## Transform Phase

### Step 3: Parse requirements

The requirements for each course are given to us as a string. For example:

```
Prereq: (One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240); Honours Math or Math/Phys students. Antireq: STAT 221, 241
```

We do the following to parse the string into our data schema:

### 1. Determine Prereqs, Antireqs, and Coreqs

We split the string using the keywords "Prereq:", "Antireq:", and "Coreq:"

### 2. Handle Antireq and Coreq

For antireq and coreq sections of the string, we parse out the courses in those sections and populate our data structure. Antireqs and coreqs are simple because the relationship is always AND for antireqs and OR for coreqs.

### 3. Handle Prereqs

Prerequisites are the most complex part to parse because they can contain nested logical expressions. We parse them into a tree structure that fits our database schema.

#### Understanding the Tree Structure

The schema uses a tree structure where:

- Each node can be either a **logical operator** (AND/OR) or a **course requirement**
- Logical operator nodes have children (referenced via parentId)
- Course requirement nodes are leaf nodes with department/courseNumber/minGrade
- The root node is stored in `coursePrerequisites.rootNodeId`

#### Parsing Strategy

We parse prerequisites in order of precedence:

1. **Handle parentheses first** - Each parenthesized group becomes a subtree
2. **Handle "One of" expressions** - Creates OR nodes
3. **Handle "and" operators** - Creates AND nodes
4. **Handle "or" operators** - Creates OR nodes
5. **Handle simple course lists** - Creates AND nodes by default

#### Example Parsing

For the example: `"(One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240)"`

This creates the following tree structure:

```
Root (AND)
├── Left subtree (OR)
│   ├── MATH 118
│   ├── MATH 119
│   ├── MATH 128
│   ├── MATH 138
│   └── MATH 148
└── Right subtree (OR)
    ├── STAT 220 (minGrade: 70)
    ├── STAT 230
    └── STAT 240
```

#### Implementation Steps

1. **Parse logical structure** - Handle parentheses and logical operators in order of precedence
2. **Extract course information** - For each course reference, extract department, course number, and minimum grade
3. **Convert to database format** - Create nodes and establish parent-child relationships

#### Special Cases to Handle

- **Grade requirements**: "with a grade of at least X%" → extract minGrade
- **Course combinations**: "MATH 118/119" → treat as OR relationship
- **Complex nested expressions**: Multiple levels of parentheses

### 4. Handle restrictions

- **Program restrictions**: "Level at least 2A Honours Math students only" → store in `courseProgramRestrictions` table

**Output**: Structured data ready for database insertion.

## Load Phase

### Step 4: Load into Database

The final step loads the transformed course data into the database using Drizzle ORM.

### Database Schema

The data is inserted into the following tables:

- **`courses`**: Basic course information (department, course number, title, description, etc.)
- **`prerequisiteNodes`**: Tree structure for prerequisite relationships
- **`coursePrerequisites`**: Links courses to their prerequisite tree root
- **`courseProgramRestrictions`**: Program-specific restrictions

### Insertion Strategy

#### 1. Transaction-based Insertion

All database operations are wrapped in transactions to ensure data consistency. If any part of the insertion fails, the entire transaction is rolled back.

#### 2. Upsert Logic

Courses are inserted using `onConflictDoUpdate` to handle cases where courses already exist in the database. This allows for:

- Updating existing courses with new information
- Re-running the import process without duplicates
- Incremental updates

#### 3. Prerequisite Tree Insertion

The prerequisite tree structure is inserted in two phases:

1. **First pass**: Insert all nodes with temporary parentId references
2. **Second pass**: Update parentId references with actual database IDs

This approach handles the circular dependency between nodes and their parent references.

#### 4. Batch Processing

Courses are processed in configurable batches (default: 50) to:

- Avoid overwhelming the database
- Provide progress feedback
- Handle large datasets efficiently

### Error Handling

The insertion process includes comprehensive error handling:

- **Individual course errors**: Failed insertions are logged but don't stop the process
- **Transaction rollback**: Database consistency is maintained
- **Detailed error reporting**: Failed courses are reported with specific error messages
- **Statistics**: Summary statistics show success/failure rates

### Performance Considerations

- **Batch size**: Configurable batch size balances performance and memory usage
- **Connection pooling**: Database connections are reused efficiently
- **Progress reporting**: Real-time feedback on insertion progress
- **Memory management**: Large datasets are processed in chunks

### Monitoring and Debugging

The insertion process provides detailed logging:

- Progress updates for each batch
- Success/failure statistics
- Error details for failed insertions
- Performance metrics (duration, throughput)

### Data Validation

Before insertion, the data is validated to ensure:

- Required fields are present
- Data types match schema expectations
- Foreign key relationships are valid
- Prerequisite tree structure is consistent
