import type { ProgramRequirements } from "~/models";

// TODO: Make this dynamically fetched from DB in the future
export const softwareEngineeringHonoursRequirement: ProgramRequirements = {
  "programName": "Software Engineering (Bachelor of Software Engineering - Honours)",
  "description": "Co-operative program offered jointly by the Faculties of Engineering and Mathematics. Students develop a strong foundation in computer science, engineering, and mathematics.",
  "degreeRequirements": [
    {
      "type": "units",
      "unitRequirement": {
        "units": 21.5,
        "description": "Total academic units required, excluding COOP and PD courses."
      }
    },
    {
      "type": "cumulative-average",
      "averageRequirement": {
        "average": 60,
        "appliesTo": "all-courses",
        // "description": "Minimum cumulative overall average of 60.0%."
      }
    },
    {
      "type": "other",
      "description": "A minimum term average of 60.0% is required. See Faculty of Engineering promotion rules."
    },
    {
      "type": "and",
    //   "description": "Co-operative Education Program Requirements.",
      "requirements": [
        {
          "type": "other",
          "description": "Complete a total of five PD courses: PD10, PD11, PD19, PD20, and one additional PD course."
        },
        {
          "type": "other",
          "description": "Complete a total of five credited work terms."
        }
      ]
    },
    {
      "type": "and",
    //   "description": "Complete 12 approved elective courses (6.0 units) distributed as follows:",
      "requirements": [
        {
          "type": "one-of-n",
          "count": 1,
        //   "description": "Undergraduate Communication Requirement: One course from the approved list, completed with a minimum grade of 60.0% prior to enrolling in the 3A term.",
          "options": [
            { "type": "course", "course": { "subject": "COMMST", "code": "100", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "COMMST", "code": "223", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "EMLS", "code": "101R", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "EMLS", "code": "102R", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "EMLS", "code": "129R", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "ENGL", "code": "109", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "ENGL", "code": "119", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "ENGL", "code": "129R", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "ENGL", "code": "209", "minimumGrade": 60 } },
            { "type": "course", "course": { "subject": "ENGL", "code": "210E", "minimumGrade": 60 } }
          ]
        },
        {
          "type": "and",
        //   "description": "Two Complementary Studies Electives (CSEs) from the Complementary Studies Course Lists for Engineering.",
          "requirements": [
            { "type": "units", "unitRequirement": { "units": 0.5, "description": "One CSE from List A (see Engineering Complementary Studies)" } },
            { "type": "units", "unitRequirement": { "units": 0.5, "description": "One CSE from List C (see Engineering Complementary Studies)" } }
          ]
        },
        {
          "type": "other",
          "description": "Three courses from the Natural Science list. If a 0.25-unit laboratory course accompanies a lecture course, the laboratory course must also be taken and the pair together count as one course towards the three-course requirement. See Natural Science List under Course Lists in the Calendar for approved courses."
        },
        {
          "type": "and",
        //   "description": "Four courses from the Technical Electives (TEs) lists. TEs may not be taken before the 3A term.",
          "requirements": [
            {
              "type": "one-of-n",
              "count": 1,
            //   "description": "One TE from List 1. See Technical Electives List 1 under Course Lists in the Calendar for approved courses.",
              "options": [
                {"type": "course", "course": {"subject": "AMATH", "code": "242"}},
                {"type": "course", "course": {"subject": "AMATH", "code": "449"}},
                {"type": "course", "course": {"subject": "CS", "code": "360"}},
                {"type": "course", "course": {"subject": "CS", "code": "365"}},
                {"type": "course", "course": {"subject": "CS", "code": "370"}},
                {"type": "course", "course": {"subject": "CS", "code": "371"}},
                {"type": "course", "course": {"subject": "CS", "code": "442"}},
                {"type": "course", "course": {"subject": "CS", "code": "444"}},
                {"type": "course", "course": {"subject": "CS", "code": "448"}},
                {"type": "course", "course": {"subject": "CS", "code": "450"}},
                {"type": "course", "course": {"subject": "CS", "code": "451"}},
                {"type": "course", "course": {"subject": "CS", "code": "452"}},
                {"type": "course", "course": {"subject": "CS", "code": "453"}},
                {"type": "course", "course": {"subject": "CS", "code": "454"}},
                {"type": "course", "course": {"subject": "CS", "code": "457"}},
                {"type": "course", "course": {"subject": "CS", "code": "459"}},
                {"type": "course", "course": {"subject": "CS", "code": "462"}},
                {"type": "course", "course": {"subject": "CS", "code": "466"}},
                {"type": "course", "course": {"subject": "CS", "code": "479"}},
                {"type": "course", "course": {"subject": "CS", "code": "480"}},
                {"type": "course", "course": {"subject": "CS", "code": "484"}},
                {"type": "course", "course": {"subject": "CS", "code": "485"}},
                {"type": "course", "course": {"subject": "CS", "code": "486"}},
                {"type": "course", "course": {"subject": "CS", "code": "487"}},
                {"type": "course", "course": {"subject": "CS", "code": "488"}},
                {"type": "course", "course": {"subject": "CS", "code": "489"}}
              ]
            },
            {
              "type": "one-of-n",
              "count": 1,
            //   "description": "One TE from List 2. See Technical Electives List 2 under Course Lists in the Calendar for approved courses.",
              "options": [
                {"type": "course", "course": {"subject": "ECE", "code": "313"}},
                {"type": "course", "course": {"subject": "ECE", "code": "320"}},
                {"type": "course", "course": {"subject": "ECE", "code": "327"}},
                {"type": "course", "course": {"subject": "ECE", "code": "340"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405A"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405B"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405C"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405D"}},
                {"type": "course", "course": {"subject": "ECE", "code": "409"}},
                {"type": "course", "course": {"subject": "ECE", "code": "416"}},
                {"type": "course", "course": {"subject": "ECE", "code": "417"}},
                {"type": "course", "course": {"subject": "ECE", "code": "423"}},
                {"type": "course", "course": {"subject": "ECE", "code": "454"}},
                {"type": "course", "course": {"subject": "ECE", "code": "455"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457A"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457B"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457C"}},
                {"type": "course", "course": {"subject": "ECE", "code": "458"}},
                {"type": "course", "course": {"subject": "ECE", "code": "459"}},
                {"type": "course", "course": {"subject": "ECE", "code": "481"}},
                {"type": "course", "course": {"subject": "ECE", "code": "486"}},
                {"type": "course", "course": {"subject": "ECE", "code": "488"}},
                {"type": "course", "course": {"subject": "ECE", "code": "493"}},
                {"type": "course", "course": {"subject": "ECE", "code": "495"}}
              ]
            },
            {
              "type": "one-of-n",
              "count": 2,
            //   "description": "Two TEs from List 1, List 2, or List 3. See Technical Electives Lists under Course Lists in the Calendar for approved courses.",
              "options": [
                {"type": "course", "course": {"subject": "AMATH", "code": "242"}},
                {"type": "course", "course": {"subject": "AMATH", "code": "449"}},
                {"type": "course", "course": {"subject": "CS", "code": "360"}},
                {"type": "course", "course": {"subject": "CS", "code": "365"}},
                {"type": "course", "course": {"subject": "CS", "code": "370"}},
                {"type": "course", "course": {"subject": "CS", "code": "371"}},
                {"type": "course", "course": {"subject": "CS", "code": "442"}},
                {"type": "course", "course": {"subject": "CS", "code": "444"}},
                {"type": "course", "course": {"subject": "CS", "code": "448"}},
                {"type": "course", "course": {"subject": "CS", "code": "450"}},
                {"type": "course", "course": {"subject": "CS", "code": "451"}},
                {"type": "course", "course": {"subject": "CS", "code": "452"}},
                {"type": "course", "course": {"subject": "CS", "code": "453"}},
                {"type": "course", "course": {"subject": "CS", "code": "454"}},
                {"type": "course", "course": {"subject": "CS", "code": "457"}},
                {"type": "course", "course": {"subject": "CS", "code": "459"}},
                {"type": "course", "course": {"subject": "CS", "code": "462"}},
                {"type": "course", "course": {"subject": "CS", "code": "466"}},
                {"type": "course", "course": {"subject": "CS", "code": "479"}},
                {"type": "course", "course": {"subject": "CS", "code": "480"}},
                {"type": "course", "course": {"subject": "CS", "code": "484"}},
                {"type": "course", "course": {"subject": "CS", "code": "485"}},
                {"type": "course", "course": {"subject": "CS", "code": "486"}},
                {"type": "course", "course": {"subject": "CS", "code": "487"}},
                {"type": "course", "course": {"subject": "CS", "code": "488"}},
                {"type": "course", "course": {"subject": "CS", "code": "489"}},
                {"type": "course", "course": {"subject": "ECE", "code": "313"}},
                {"type": "course", "course": {"subject": "ECE", "code": "320"}},
                {"type": "course", "course": {"subject": "ECE", "code": "327"}},
                {"type": "course", "course": {"subject": "ECE", "code": "340"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405A"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405B"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405C"}},
                {"type": "course", "course": {"subject": "ECE", "code": "405D"}},
                {"type": "course", "course": {"subject": "ECE", "code": "409"}},
                {"type": "course", "course": {"subject": "ECE", "code": "416"}},
                {"type": "course", "course": {"subject": "ECE", "code": "417"}},
                {"type": "course", "course": {"subject": "ECE", "code": "423"}},
                {"type": "course", "course": {"subject": "ECE", "code": "454"}},
                {"type": "course", "course": {"subject": "ECE", "code": "455"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457A"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457B"}},
                {"type": "course", "course": {"subject": "ECE", "code": "457C"}},
                {"type": "course", "course": {"subject": "ECE", "code": "458"}},
                {"type": "course", "course": {"subject": "ECE", "code": "459"}},
                {"type": "course", "course": {"subject": "ECE", "code": "481"}},
                {"type": "course", "course": {"subject": "ECE", "code": "486"}},
                {"type": "course", "course": {"subject": "ECE", "code": "488"}},
                {"type": "course", "course": {"subject": "ECE", "code": "493"}},
                {"type": "course", "course": {"subject": "ECE", "code": "495"}},
                {"type": "course", "course": {"subject": "BIOL", "code": "487"}},
                {"type": "course", "course": {"subject": "CO", "code": "331"}},
                {"type": "course", "course": {"subject": "CO", "code": "342"}},
                {"type": "course", "course": {"subject": "CO", "code": "351"}},
                {"type": "course", "course": {"subject": "CO", "code": "353"}},
                {"type": "course", "course": {"subject": "CO", "code": "367"}},
                {"type": "course", "course": {"subject": "CO", "code": "456"}},
                {"type": "course", "course": {"subject": "CO", "code": "481"}},
                {"type": "course", "course": {"subject": "CO", "code": "485"}},
                {"type": "course", "course": {"subject": "CO", "code": "487"}},
                {"type": "course", "course": {"subject": "CS", "code": "467"}},
                {"type": "course", "course": {"subject": "MSE", "code": "343"}},
                {"type": "course", "course": {"subject": "MSE", "code": "446"}},
                {"type": "course", "course": {"subject": "MSE", "code": "543"}},
                {"type": "course", "course": {"subject": "MTE", "code": "544"}},
                {"type": "course", "course": {"subject": "MTE", "code": "546"}},
                {"type": "course", "course": {"subject": "PHYS", "code": "467"}},
                {"type": "course", "course": {"subject": "SE", "code": "498"}},
                {"type": "course", "course": {"subject": "STAT", "code": "440"}},
                {"type": "course", "course": {"subject": "STAT", "code": "441"}},
                {"type": "course", "course": {"subject": "STAT", "code": "442"}},
                {"type": "course", "course": {"subject": "STAT", "code": "444"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "533"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "543"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "548"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "552"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "556"}},
                {"type": "course", "course": {"subject": "SYDE", "code": "575"}}
              ]
            }
          ]
        },
        {
          "type": "units",
          "unitRequirement": {
            "units": 1.0,
            "description": "Two electives chosen from any 0.5-unit courses (Free Electives)."
          }
        },
        {
          "type": "one-of-n",
          "count": 1,
        //   "description": "One sustainability-related course. This course may also be counted towards another elective requirement (e.g., Natural Science elective, Complementary Studies elective) if part of that list. See Sustainability-related Course List under Course Lists in the Calendar for approved courses.",
          "options": [
            {"type": "course", "course": {"subject": "BIOL", "code": "489"}},
            {"type": "course", "course": {"subject": "EARTH", "code": "270"}},
            {"type": "course", "course": {"subject": "ENBUS", "code": "102"}},
            {"type": "course", "course": {"subject": "ENBUS", "code": "211"}},
            {"type": "course", "course": {"subject": "ENGL", "code": "248"}},
            {"type": "course", "course": {"subject": "ENVS", "code": "105"}},
            {"type": "course", "course": {"subject": "ENVS", "code": "200"}},
            {"type": "course", "course": {"subject": "ENVS", "code": "205"}},
            {"type": "course", "course": {"subject": "ENVS", "code": "220"}},
            {"type": "course", "course": {"subject": "ERS", "code": "215"}},
            {"type": "course", "course": {"subject": "ERS", "code": "225"}},
            {"type": "course", "course": {"subject": "ERS", "code": "253"}},
            {"type": "course", "course": {"subject": "ERS", "code": "270"}},
            {"type": "course", "course": {"subject": "ERS", "code": "294"}},
            {"type": "course", "course": {"subject": "ERS", "code": "310"}},
            {"type": "course", "course": {"subject": "ERS", "code": "316"}},
            {"type": "course", "course": {"subject": "ERS", "code": "320"}},
            {"type": "course", "course": {"subject": "ERS", "code": "328"}},
            {"type": "course", "course": {"subject": "ERS", "code": "361"}},
            {"type": "course", "course": {"subject": "ERS", "code": "370"}},
            {"type": "course", "course": {"subject": "ERS", "code": "372"}},
            {"type": "course", "course": {"subject": "ERS", "code": "404"}},
            {"type": "course", "course": {"subject": "GEOG", "code": "203"}},
            {"type": "course", "course": {"subject": "GEOG", "code": "207"}},
            {"type": "course", "course": {"subject": "GEOG", "code": "225"}},
            {"type": "course", "course": {"subject": "GEOG", "code": "361"}},
            {"type": "course", "course": {"subject": "GEOG", "code": "459"}},
            {"type": "course", "course": {"subject": "PACS", "code": "310"}},
            {"type": "course", "course": {"subject": "PHIL", "code": "224"}},
            {"type": "course", "course": {"subject": "PLAN", "code": "451"}},
            {"type": "course", "course": {"subject": "PSCI", "code": "432"}},
            {"type": "course", "course": {"subject": "RCS", "code": "285"}},
            {"type": "course", "course": {"subject": "SCI", "code": "200"}},
            {"type": "course", "course": {"subject": "SCI", "code": "201"}},
            {"type": "course", "course": {"subject": "THPERF", "code": "374"}}
          ]
        }
      ]
    }
  ],
  "levelRequirements": {
    "1A": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "137" } },
          { "type": "course", "course": { "subject": "CHE", "code": "102" } },
          { "type": "course", "course": { "subject": "MATH", "code": "115" } },
          { "type": "course", "course": { "subject": "MATH", "code": "117" } },
          { "type": "course", "course": { "subject": "MATH", "code": "135" } },
          { "type": "course", "course": { "subject": "SE", "code": "101" } }
        ]
      }
    ],
    "1B": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "138" } },
          { "type": "course", "course": { "subject": "ECE", "code": "124" } },
          { "type": "course", "course": { "subject": "ECE", "code": "140" } },
          { "type": "course", "course": { "subject": "ECE", "code": "192" } },
          { "type": "course", "course": { "subject": "MATH", "code": "119" } },
          { "type": "course", "course": { "subject": "SE", "code": "102" } },
          { "type": "other", "description": "Complete 1 approved elective." }
        ]
      }
    ],
    "2A": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "241" } },
          { "type": "course", "course": { "subject": "ECE", "code": "222" } },
          { "type": "course", "course": { "subject": "SE", "code": "201" } },
          { "type": "course", "course": { "subject": "SE", "code": "212" } },
          { "type": "course", "course": { "subject": "STAT", "code": "206" } },
          {
            "type": "one-of-n",
            "count": 1,
            "options": [
              { "type": "course", "course": { "subject": "ECE", "code": "105" } },
              { "type": "course", "course": { "subject": "PHYS", "code": "115" } },
              { "type": "course", "course": { "subject": "PHYS", "code": "121" } }
            ]
          }
        ]
      }
    ],
    "2B": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "240" } },
          { "type": "course", "course": { "subject": "CS", "code": "247" } },
          { "type": "course", "course": { "subject": "CS", "code": "348" } },
          { "type": "course", "course": { "subject": "MATH", "code": "239" } },
          { "type": "course", "course": { "subject": "SE", "code": "202" } },
          { "type": "other", "description": "Complete 1 approved elective." }
        ]
      }
    ],
    "3A": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "341" } },
          { "type": "course", "course": { "subject": "MATH", "code": "213" } },
          { "type": "course", "course": { "subject": "SE", "code": "301" } },
          { "type": "course", "course": { "subject": "SE", "code": "350" } },
          { "type": "course", "course": { "subject": "SE", "code": "464" } },
          { "type": "course", "course": { "subject": "SE", "code": "465" } },
          { "type": "other", "description": "Complete 1 approved elective. The Undergraduate Communication Requirement must be completed by this term." }
        ]
      }
    ],
    "3B": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "CS", "code": "343" } },
          { "type": "course", "course": { "subject": "ECE", "code": "358" } },
          { "type": "course", "course": { "subject": "SE", "code": "302" } },
          { "type": "course", "course": { "subject": "SE", "code": "380" } },
          { "type": "course", "course": { "subject": "SE", "code": "463" } },
          {
            "type": "one-of-n",
            "count": 1,
            "options": [
              { "type": "course", "course": { "subject": "CS", "code": "349" } },
              { "type": "course", "course": { "subject": "CS", "code": "449" } },
              { "type": "course", "course": { "subject": "MSE", "code": "343" } }
            ]
          },
          { "type": "other", "description": "Complete 1 approved elective." }
        ]
      }
    ],
    "4A": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "SE", "code": "401" } },
          {
            "type": "one-of-n",
            "count": 1,
            "options": [
              { "type": "course", "course": { "subject": "GENE", "code": "403" } },
              { "type": "course", "course": { "subject": "SE", "code": "490" } }
            ]
          },
          { "type": "other", "description": "Complete 4 approved electives." }
        ]
      }
    ],
    "4B": [
      {
        "type": "and",
        "requirements": [
          { "type": "course", "course": { "subject": "SE", "code": "402" } },
          {
            "type": "one-of-n",
            "count": 1,
            "options": [
              { "type": "course", "course": { "subject": "GENE", "code": "404" } },
              { "type": "course", "course": { "subject": "SE", "code": "491" } }
            ]
          },
          { "type": "other", "description": "Complete 4 approved electives." }
        ]
      }
    ]
  },
  "specializationRequirements": [
    {
      "type": "other",
      "description": "Students may choose to focus their elective choices by completing one (or more) of four available specializations: SE-Artificial Intelligence Specialization, SE-Business Specialization, SE-Computational Fine Art Specialization, or SE-Human-Computer Interaction Specialization. Refer to the calendar for specific requirements for each specialization."
    }
  ],
  "notes": [
    "Stream 8X is the primary co-op stream. Students may choose to switch to stream 8Y after the 3B term, with advisor approval.",
    "For the Natural Science requirement, if a 0.25-unit laboratory course accompanies a lecture course, the laboratory course must also be taken and the pair together count as one course towards the three-course requirement.",
    "To accommodate an elective reduced load, CHE102, CS343, CS348, CS349, CS449, ECE140, ECE192, ECE358, MSE343, and SE380 may be taken out of sequence.",
    "Courses in the Technical Electives Lists may not be taken before the 3A term.",
    "Students will only be permitted to use the WD and WF provisions used in the Faculty of Mathematics to withdraw from extra courses taken above the degree requirements.",
    "Exceptions to the requirements and electives listed above require prior approval of the Software Engineering Director.",
    "Software Engineering students are considered as both Engineering and Mathematics students.",
    "Students can take advantage of degree enhancements available to students from either faculty. These enhancements take the form of additional plans such as options, specializations, minors, and joint honours. Before declaring any academic plan, see invalid credential combinations.",
    "Students are eligible for Awards of Excellence in the Faculty of Engineering as well as for Awards of Excellence in the Faculty of Mathematics.",
    "The Software Engineering plan is also considered an Honours Mathematics plan for purposes of student access to Mathematics courses.",
    "The 12 approved electives (6.0 units) are typically scheduled as follows: one in 1B, one in 2B, one in 3A, one in 3B, four in 4A, and four in 4B.",
    "The sustainability-related course requirement can be satisfied by a course that also fulfills another elective requirement (e.g., Natural Science or Complementary Studies elective)."
  ]
}
