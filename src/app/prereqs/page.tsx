'use client';
import { useState } from "react";
import { api } from "~/trpc/react";
import { MessageSquareOff } from "lucide-react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
    createColumnHelper,
} from "@tanstack/react-table";

type PrereqRow = {
    department: string;
    courseNumber: string;
    minGrade: number | null;
    fall: boolean;
    winter: boolean;
    spring: boolean;
};

const columnHelper = createColumnHelper<PrereqRow>();

export default function PrereqsPage() {
    const [department, setDepartment] = useState("");
    const [courseNumber, setCourseNumber] = useState("");
    const [submittedDepartment, setSubmittedDepartment] = useState("");
    const [submittedCourseNumber, setSubmittedCourseNumber] = useState("");

    const query = api.prereqsWithOfferings.getCoursePrereqs.useQuery(
        {
            department: submittedDepartment,
            courseNumber: submittedCourseNumber,
        },
        {
            enabled: Boolean(submittedDepartment && submittedCourseNumber),
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (department.trim() && courseNumber.trim()) {
            setSubmittedDepartment(department.trim().toUpperCase());
            setSubmittedCourseNumber(courseNumber.trim());
        }
    };

    const columns = [
        columnHelper.accessor("department", {
            header: "Department",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("courseNumber", {
            header: "Course Number",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("minGrade", {
            header: "Min Grade",
            cell: (info) => {
                const value = info.getValue();
                return value !== null ? value : "-";
            },
        }),
        columnHelper.accessor("fall", {
            header: "Fall",
            cell: (info) => (info.getValue() ? "✔️" : ""),
        }),
        columnHelper.accessor("winter", {
            header: "Winter",
            cell: (info) => (info.getValue() ? "✔️" : ""),
        }),
        columnHelper.accessor("spring", {
            header: "Spring",
            cell: (info) => (info.getValue() ? "✔️" : ""),
        }),
    ];

    const table = useReactTable({
        data: query.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const showNoResults =
        submittedDepartment &&
        submittedCourseNumber &&
        !query.isLoading &&
        !query.error &&
        query.data &&
        query.data.length === 0;

    const hasSubmitted = Boolean(submittedDepartment && submittedCourseNumber);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Course Prerequisites Lookup</h1>

            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                        </label>
                        <input
                            id="department"
                            type="text"
                            placeholder="e.g., MATH, CS, PHYS"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="courseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Course Number
                        </label>
                        <input
                            id="courseNumber"
                            type="text"
                            placeholder="e.g., 101, 205A, 300"
                            value={courseNumber}
                            onChange={(e) => setCourseNumber(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={query.isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
                        >
                            {query.isLoading ? "Loading..." : "Search"}
                        </button>
                    </div>
                </div>
            </form>

            {/* Loading State */}
            {query.isLoading && hasSubmitted && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading prerequisites...</span>
                </div>
            )}

            {/* Error State */}
            {query.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                {query.error.message || "Failed to fetch prerequisites. Please try again."}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Results State */}
            {showNoResults && (
                <div className="text-center py-12">
                    <MessageSquareOff className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No prerequisites found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No course found for <span className="font-semibold">{submittedDepartment} {submittedCourseNumber}</span>.
                    </p>
                    <p className="text-sm text-gray-500">
                        Please check the department and course number, or try a different course.
                    </p>
                </div>
            )}

            {/* Results Table */}
            {query.data && query.data.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Prerequisites for {submittedDepartment} {submittedCourseNumber}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {query.data.length} prerequisite{query.data.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
