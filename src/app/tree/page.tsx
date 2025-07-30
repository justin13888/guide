"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import PrerequisiteTreeVisualization from "~/app/_components/prerequisite-tree-visualization";

export default function CourseTreePage() {
    const [department, setDepartment] = useState("");
    const [courseNumber, setCourseNumber] = useState("");

    const {
        data: treeData,
        isLoading,
        error,
        refetch,
    } = api.planner.getPrerequisiteLinks.useQuery(
        { department, courseNumber },
        {
            enabled: department.length > 0 && courseNumber.length > 0,
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (department && courseNumber) {
            void refetch();
        }
    };

    // Quick access to common courses
    const commonCourses = [
        { dept: "CS", num: "135", name: "Designing Functional Programs" },
        { dept: "CS", num: "136", name: "Elementary Algorithm Design and Data Abstraction" },
        { dept: "CS", num: "240", name: "Data Structures and Data Management" },
        { dept: "CS", num: "241", name: "Foundations of Sequential Programs" },
        { dept: "MATH", num: "135", name: "Algebra for Honours Mathematics" },
        { dept: "MATH", num: "137", name: "Calculus 1 for Honours Mathematics" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Course Prerequisite Tree
                    </h1>
                    <p className="text-gray-600">
                        Visualize the prerequisite structure for any course
                    </p>
                </div>

                {/* Quick Access */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {commonCourses.map((course) => (
                            <Link
                                key={`${course.dept}${course.num}`}
                                href={`/tree/${course.dept}${course.num}`}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                            >
                                <div className="font-medium text-sm text-gray-900">
                                    {course.dept} {course.num}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {course.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Input Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Search Course</h2>
                    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                                Department
                            </label>
                            <input
                                type="text"
                                id="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                                placeholder="e.g., CS, MATH, ENGL"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="courseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                Course Number
                            </label>
                            <input
                                type="text"
                                id="courseNumber"
                                value={courseNumber}
                                onChange={(e) => setCourseNumber(e.target.value)}
                                placeholder="e.g., 135, 240, 392"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!department || !courseNumber || isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Loading..." : "Generate Tree"}
                        </button>
                    </form>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="text-red-800">
                                <strong>Error:</strong> {error.message}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {treeData && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {treeData.targetCourse.department} {treeData.targetCourse.courseNumber}
                                    {treeData.targetCourse.title && ` - ${treeData.targetCourse.title}`}
                                </h2>
                                <div className="text-sm text-gray-600 mt-2">
                                    {treeData.totalNodes === 0 ? (
                                        <span className="text-green-600 font-medium">No prerequisites required</span>
                                    ) : (
                                        <span>
                                            Total nodes: {treeData.totalNodes}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={`/tree/${department}${courseNumber}`}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            >
                                Permalink
                            </Link>
                        </div>

                        {treeData.totalNodes > 0 ? (
                            <PrerequisiteTreeVisualization data={treeData} />
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                This course has no prerequisites.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
