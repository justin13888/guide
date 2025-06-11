import { describe, it, expect } from "vitest";
import {
  parsePrerequisites,
  buildPrerequisiteTree,
  parseRequirementsDescription,
} from "../../scripts/import-courses/step3-parse-requirements";

describe("Prerequisite Parsing", () => {
  it("should parse basic prerequisite string", () => {
    const testString =
      "(One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240)";

    const result = parsePrerequisites(testString);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should build prerequisite tree correctly", () => {
    const testString =
      "(One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240)";

    const parsed = parsePrerequisites(testString);

    if (parsed.length > 0 && parsed[0]!.requirements.length > 0) {
      const tree = buildPrerequisiteTree(parsed[0]!.requirements);

      expect(tree).toBeDefined();
      expect(tree.nodes).toBeDefined();
      expect(Array.isArray(tree.nodes)).toBe(true);
    }
  });

  it("should handle empty prerequisite string", () => {
    const result = parsePrerequisites("");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should parse comples level and program restrictions", () => {
    const testString =
      "Prereq: BIOL 273; Level at least 3A Gerontology Minor or Option in Aging Studies or Diploma in Gerontology students only";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.restrictions).toBeDefined();
    expect(Array.isArray(result.restrictions)).toBe(true);

    // Check that BIOL 273 course requirement is parsed
    expect(result.groups.length).toBeGreaterThan(0);
    const firstGroup = result.groups[0];
    expect(firstGroup).toBeDefined();
    if (firstGroup) {
      expect(firstGroup.requirements.length).toBeGreaterThan(0);
      expect(firstGroup.requirements[0]!.relatedDepartment).toBe("BIOL");
      expect(firstGroup.requirements[0]!.relatedCourseNumber).toBe("273");
    }

    // Check that level restriction is parsed
    const levelRestriction = result.restrictions.find(
      (r) => r.requirementType === "LEVEL",
    );
    expect(levelRestriction).toBeDefined();
    expect(levelRestriction!.value).toBe("3A");

    // Check that program restriction is parsed
    const programRestrictions = result.restrictions.filter(
      (r) => r.requirementType === "PROGRAM",
    );
    expect(programRestrictions.length).toBe(3);
    expect(programRestrictions.map((r) => r.value)).toEqual([
      "Gerontology Minor",
      "Option in Aging Studies",
      "Diploma in Gerontology",
    ]);
  });
});
