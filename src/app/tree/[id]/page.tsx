"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import PrerequisiteTreeVisualization from "~/app/_components/prerequisite-tree-visualization";

export default function CourseTreeIdPage() {
    const params = useParams();
    const courseId = params.id as string;

    const [department, setDepartment] = useState("");
    const [courseNumber, setCourseNumber] = useState("");

    // Parse the course ID when component mounts
    useEffect(() => {
        if (courseId) {
            // Try to parse formats like "CS135", "MATH135", "CS-135", "MATH-135"
            const regex = /^([A-Z]+)[-_]?(\d+[A-Z]?)$/i;
            const match = regex.exec(courseId);
            if (match?.[1] && match?.[2]) {
                setDepartment(match[1].toUpperCase());
                setCourseNumber(match[2]);
            }
        }
    }, [courseId]);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Course Prerequisite Tree
                    </h1>
                    <p className="text-gray-600">
                        Visualize the prerequisite structure for {courseId ? `${courseId}` : 'any course'}
                    </p>
                </div>

                {/* Input Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
                        <div className="mb-4">
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
