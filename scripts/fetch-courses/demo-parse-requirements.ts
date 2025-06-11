import { parseRequirementsDescription } from "./parse-requirements";

// Example requirement strings to test
const examples = [
  "Prereq: CS 135",
  "Prereq: CS 135, CS 136",
  "Prereq: CS 135; MATH 137",
  "Prereq: CS 135 CS 136",
  "Level at least 2A",
  "Computer Science students only",
  "Prereq: CS 135, CS 136. Antireq: CS 145. Level at least 2A. Computer Science students only.",
  "Prereq: CS 135A, CS 135B",
  "Prereq: MATH 137, STAT 230, PHYS 121",
  "Prereq: CS 241. Antireq: CS 240. Level at least 3A. Software Engineering students only.",
];

console.log("=== parseRequirementsDescription Demo ===\n");

examples.forEach((example, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(`Input: "${example}"`);
  
  const result = parseRequirementsDescription(example);
  
  console.log("Output:");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n" + "=".repeat(50) + "\n");
});
