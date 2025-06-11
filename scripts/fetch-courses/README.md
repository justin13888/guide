This script calls the UW OpenData API to fetch course information.

We then transform the data and load it into the database.

API docs URL: https://openapi.data.uwaterloo.ca/api-docs/index.html

## Step 1: Fetching course data

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

## Step 2: Determine term offerings

We call the API with 3 term codes (1249 for Fall 2024, 1251 for Winter 2025, and 1255 for Spring 2025) to get a list of courseIDs of the courses that are offered every term. We then go through the courses from Step 1, cross-referencing with the 3 lists.

## Step 3: Parse requirements

The requirements for each course are given to us as a string. For example...

We do the following to parse the string into our data schema:

### 1. Determine Prereqs, Antireqs, and Coreqs

We split the string using the keywords "Prereq:", "Antireq:", and "Coreq:"

### 2. Handle Antireq and Coreq

For antireq and coreq sections of the string, we parse out the courses in those sections and populate our data structure. Antireqs and coreqs are simple because the relationship is always AND for antireqs and OR for coreqs.

### 3. Handle Prereqs
