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

  it("should parse complex level and program restrictions", () => {
    const testString =
      "Prereq: BIOL 273; Level at least 3A Gerontology Minor or Option in Aging Studies or Diploma in Gerontology students only";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that BIOL 273 course requirement is parsed
    expect(result.groups.length).toBeGreaterThan(0);
    const firstGroup = result.groups[0];
    expect(firstGroup).toBeDefined();
    if (firstGroup) {
      expect(firstGroup.requirements.length).toBeGreaterThan(0);
      expect(firstGroup.requirements[0]!.relatedDepartment).toBe("BIOL");
      expect(firstGroup.requirements[0]!.relatedCourseNumber).toBe("273");
    }

    // Check that program restrictions are parsed with level applied to first program only
    expect(result.programRestrictions.length).toBe(3);

    const expectedPrograms = [
      {
        program: "Gerontology Minor",
        level: "3A",
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Option in Aging Studies",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Diploma in Gerontology",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

  it("should parse AND program restrictions", () => {
    const testString =
      "Prereq: PHYS 122L; Honours Materials and Nanosciences and Honours Physics students only";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that PHYS 122L course requirement is parsed
    expect(result.groups.length).toBeGreaterThan(0);
    const firstGroup = result.groups[0];
    expect(firstGroup).toBeDefined();
    if (firstGroup) {
      expect(firstGroup.requirements.length).toBeGreaterThan(0);
      expect(firstGroup.requirements[0]!.relatedDepartment).toBe("PHYS");
      expect(firstGroup.requirements[0]!.relatedCourseNumber).toBe("122L");
    }

    // Check that program restrictions are parsed correctly
    expect(result.programRestrictions.length).toBe(3);

    const expectedPrograms = [
      {
        program: "Honours Materials",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Nanosciences",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Honours Physics",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

  it("should parse program restrictions from complex prerequisite string", () => {
    const testString =
      "Prereq: (One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240); Honours Math or Math/Phys students. Antireq: STAT 221, 241";

    const result = parseRequirementsDescription(testString);

    console.log("Full result:", JSON.stringify(result, null, 2));
    console.log("Program restrictions:", result.programRestrictions);
    console.log(
      "Number of program restrictions:",
      result.programRestrictions.length,
    );

    expect(result).toBeDefined();
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that program restrictions are parsed correctly
    expect(result.programRestrictions.length).toBe(2);

    const expectedPrograms = [
      {
        program: "Honours Math",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Math/Phys",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

  it("should parse complex prerequisite string with multiple course requirements and program restrictions", () => {
    const testString =
      "Prereq: CS 240 or 240E; One of CS 245, 245E, SE 212; MATH 239 or MATH 249; One of STAT 206, STAT 230, STAT 240; Honours Computer Science, Honours Data Science (BCS, BMath), BCFM, BSE students only. Antireq: CS 231, ECE 406";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that course requirements are parsed correctly
    expect(result.groups.length).toBeGreaterThan(0);

    // Check that program restrictions are parsed correctly
    expect(result.programRestrictions.length).toBe(4);

    const expectedPrograms = [
      {
        program: "Honours Computer Science",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Honours Data Science (BCS, BMath)",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "BCFM",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "BSE",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

  it("should parse level and multiple program restrictions with slashes and commas", () => {
    const testString =
      "Prereq: Level at least 3A; Accounting and Financial Management, Biotechnology/Chartered Professional Accountancy, Computing and Financial Management, Mathematics/Chartered Professional Accountancy, or Sustainability and Financial Management students";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that program restrictions are parsed correctly
    expect(result.programRestrictions.length).toBe(5);

    const expectedPrograms = [
      {
        program: "Accounting and Financial Management",
        level: "3A",
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Biotechnology/Chartered Professional Accountancy",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Computing and Financial Management",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Mathematics/Chartered Professional Accountancy",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Sustainability and Financial Management",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

  it("should handle courses with no level restrictions", () => {
    const testString = "Prereq: MATH 137";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.minLevel).toBe(null);
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that MATH 137 course requirement is parsed
    expect(result.groups.length).toBeGreaterThan(0);
    const firstGroup = result.groups[0];
    expect(firstGroup).toBeDefined();
    if (firstGroup) {
      expect(firstGroup.requirements.length).toBeGreaterThan(0);
      expect(firstGroup.requirements[0]!.relatedDepartment).toBe("MATH");
      expect(firstGroup.requirements[0]!.relatedCourseNumber).toBe("137");
    }

    expect(result.programRestrictions.length).toBe(0);
  });

  it("should parse AVIA 417 exact string", () => {
    const testString =
      "Prereq: AVIA 310; Geography and Aviation or Science and Aviation students";

    const result = parseRequirementsDescription(testString);

    expect(result).toBeDefined();
    expect(result.minLevel).toBe(null);
    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.programRestrictions).toBeDefined();
    expect(Array.isArray(result.programRestrictions)).toBe(true);

    // Check that AVIA 310 course requirement is parsed
    expect(result.groups.length).toBeGreaterThan(0);
    const firstGroup = result.groups[0];
    expect(firstGroup).toBeDefined();
    if (firstGroup) {
      expect(firstGroup.requirements.length).toBeGreaterThan(0);
      expect(firstGroup.requirements[0]!.relatedDepartment).toBe("AVIA");
      expect(firstGroup.requirements[0]!.relatedCourseNumber).toBe("310");
    }

    // Check that program restrictions are parsed correctly
    expect(result.programRestrictions.length).toBe(2);

    const expectedPrograms = [
      {
        program: "Geography and Aviation",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
      {
        program: "Science and Aviation",
        level: null,
        restrictionType: "INCLUDE" as const,
      },
    ];

    expect(result.programRestrictions).toEqual(expectedPrograms);
  });

});
