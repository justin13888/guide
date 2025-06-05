import { z } from 'zod';

export const courseSubjectSchema = z.string().min(2).max(10).describe('e.g., MATH, CS, ENGL');
export type CourseSubject = z.infer<typeof courseSubjectSchema>;

export const courseSchema = z.object({
  subject: z.string().min(2).max(10).describe('e.g., MATH, CS, ENGL'),
  code: z.string().min(3).max(5).describe('e.g., 135, 240, 392'), // TODO: Validate for "136", "136L", etc.
});
export type Course = z.infer<typeof courseSchema>;

export const courseWithGradeSchema = courseSchema.extend({
  minimumGrade: z.number().int().min(0).max(100).optional().describe('Minimum percentage grade required for this course.'),
});
export type CourseWithGrade = z.infer<typeof courseWithGradeSchema>;

export const unitRequirementSchema = z.object({
  units: z.number().min(0.0).describe('Number of academic units (credits) required.'),
  fromCourses: z.array(courseSchema).optional().describe('Specific courses these units must come from.'),
  fromDepartments: z.array(z.string()).optional().describe('Units from any course within these departments.'),
  atLevel: z.union([z.literal('100-level'), z.literal('200-level'), z.literal('300-level'), z.literal('400-level'), z.literal('graduate-level')]).optional().describe('Units must be at or above this academic level.'),
  atOrAboveLevel: z.number().int().min(100).optional().describe('Units must be at or above this numeric level (e.g., 300 for 300-level or higher).'),
  description: z.string().optional().describe('A descriptive string for complex unit requirements, e.g., "1.0 unit in Communication courses".'),
});
export type UnitRequirement = z.infer<typeof unitRequirementSchema>;

// 5. Cumulative Average Requirements
export const cumulativeAverageSchema = z.object({
  average: z.number().int().min(0).max(100).describe('Minimum cumulative average required.'),
  appliesTo: z.union([
    z.literal('all-courses'),
    z.literal('major-courses'),
    z.literal('faculty-courses'),
    z.array(courseSchema)
  ]).describe('Indicates which set of courses the average applies to.'),
});
export type CumulativeAverage = z.infer<typeof cumulativeAverageSchema>;

// 6. Base Requirement Schema (for recursion setup)
const baseRequirementSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('course'), course: courseWithGradeSchema }),
  z.object({ type: z.literal('units'), unitRequirement: unitRequirementSchema }),
  z.object({ type: z.literal('cumulative-average'), averageRequirement: cumulativeAverageSchema }),
  z.object({ type: z.literal('other'), description: z.string() }), // For highly specific, unmodellable text requirements
]);

// 7. Forward declaration for recursive requirements
type RequirementSchemaType = z.infer<typeof baseRequirementSchema> | 
  { type: 'and', requirements: RequirementSchemaType[] } | 
  { type: 'or', requirements: RequirementSchemaType[] } | 
  { type: 'one-of-n', count: number, options: RequirementSchemaType[] } |
  { type: 'excluding', excluded: { code: string; subject: string; }[], inclusive?: { code: string; subject: string; }[] } |
  { type: 'prerequisite', course: { code: string; subject: string; }, prerequisite: RequirementSchemaType } |
  { type: 'corequisite', course: { code: string; subject: string; }, corequisite: RequirementSchemaType } |
  { type: 'level-completion', level: string, description?: string };

// 8. Full Requirement Schema (recursive for complex conditions)
const requirementSchema: z.ZodSchema<RequirementSchemaType> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('course'), course: courseWithGradeSchema }),
    z.object({ type: z.literal('units'), unitRequirement: unitRequirementSchema }),
    z.object({ type: z.literal('cumulative-average'), averageRequirement: cumulativeAverageSchema }),
    z.object({ type: z.literal('and'), requirements: z.array(requirementSchema) }), // All sub-requirements must be met
    z.object({ type: z.literal('or'), requirements: z.array(requirementSchema) }),  // At least one sub-requirement must be met
    z.object({ type: z.literal('one-of-n'), count: z.number().int().min(1), options: z.array(requirementSchema) }).describe('e.g., 2 of the following 3 courses'),
    z.object({ type: z.literal('excluding'), excluded: z.array(courseSchema), inclusive: z.array(courseSchema).optional().describe('If specified, select from inclusive list excluding specified courses, otherwise exclude from any course') }), // e.g., may not hold credit for both
    z.object({ type: z.literal('prerequisite'), course: courseSchema, prerequisite: requirementSchema }),
    z.object({ type: z.literal('corequisite'), course: courseSchema, corequisite: requirementSchema }),
    z.object({ type: z.literal('level-completion'), level: z.string(), description: z.string().optional() }), // e.g., "Level 2A must be completed"
    z.object({ type: z.literal('other'), description: z.string() }), // Fallback for highly specific text requirements
  ])
);
export type Requirement = z.infer<typeof requirementSchema>;

export const programRequirementsSchema = z.object({
  programName: z.string().describe('The name of the program or plan.'),
  description: z.string().optional().describe('Overall description of the program requirements.'),
  admissionRequirements: z.array(requirementSchema).optional().describe('Requirements to be admitted to the program.'),
  degreeRequirements: z.array(requirementSchema).optional().describe('General requirements for the degree (e.g., total units, average).'),
  majorRequirements: z.array(requirementSchema).optional().describe('Specific requirements for the major.'),
  minorRequirements: z.array(requirementSchema).optional().describe('Specific requirements for a minor, if applicable.'),
  specializationRequirements: z.array(requirementSchema).optional().describe('Specific requirements for a specialization, if applicable.'),
  levelRequirements: z.record(z.string(), z.array(requirementSchema)).optional().describe('Requirements broken down by academic level (e.g., "1A": [...]).'),
  notes: z.array(z.string()).optional().describe('Any additional notes or caveats.'),
});
export type ProgramRequirements = z.infer<typeof programRequirementsSchema>;
