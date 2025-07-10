"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface PrerequisitePath {
  department: string;
  courseNumber: string;
  title?: string;
  path: Array<{
    department: string;
    courseNumber: string;
    title?: string;
  }>;
  depth: number;
  relationContext?: string;
}

export default function   PrerequisitePathsDemo() {
  const [department, setDepartment] = useState("CS");
  const [courseNumber, setCourseNumber] = useState("4820");
  const [maxDepth, setMaxDepth] = useState(10);

  const { data, isLoading, error, refetch } = api.planner.getPrerequisiteChains.useQuery(
    { department, courseNumber, maxDepth },
    { enabled: false } // Only run when explicitly triggered
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void refetch();
  };

  const renderPath = (path: PrerequisitePath["path"]) => {
    return path.map((course, index) => (
      <span key={`${course.department}-${course.courseNumber}`}>
        {index > 0 && " → "}
        <span className="font-mono text-blue-600">
          {course.department} {course.courseNumber}
        </span>
      </span>
    ));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Course Prerequisite Path Analyzer
      </h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Search for Prerequisite Paths</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CS, MATH, STAT"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Number
              </label>
              <input
                type="text"
                value={courseNumber}
                onChange={(e) => setCourseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4820, 3110"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Depth
              </label>
              <input
                type="number"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Analyzing..." : "Find Prerequisite Paths"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-green-800 font-medium text-lg mb-2">
              Analysis Complete for {data.targetCourse.department} {data.targetCourse.courseNumber}
            </h3>
            {data.targetCourse.title && (
              <p className="text-green-700 mb-2">{data.targetCourse.title}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Paths:</span> {data.totalPaths}
              </div>
              <div>
                <span className="font-medium">Max Depth:</span> {data.maxDepth}
              </div>
              <div>
                <span className="font-medium">Unique Prerequisites:</span>{" "}
                {new Set(data.paths.map(p => `${p.department} ${p.courseNumber}`)).size}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Prerequisite Paths</h3>
            
            {data.paths.length === 0 ? (
              <p className="text-gray-600 italic">
                No prerequisites found for this course.
              </p>
            ) : (
              <div className="space-y-4">
                {data.paths
                  .sort((a, b) => a.depth - b.depth || a.department.localeCompare(b.department))
                  .map((path, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-lg">
                            {path.department} {path.courseNumber}
                          </h4>
                          {path.relationContext && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {path.relationContext}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Depth: {path.depth}
                        </span>
                      </div>
                      
                      {path.title && (
                        <p className="text-gray-600 text-sm mb-2">{path.title}</p>
                      )}
                      
                      {path.path.length > 0 && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Prerequisite Chain:</span>{" "}
                          {renderPath(path.path)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
