'use client';
import { useState } from "react";
import { api } from "~/trpc/react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
    type CellContext,
    type Row,
    type HeaderGroup,
} from "@tanstack/react-table";

type PrereqRow = {
    department: string;
    courseNumber: string;
    minGrade: number | null;
    fall: boolean;
    winter: boolean;
    spring: boolean;
};

export default function PrereqsPage() {
    const [department, setDepartment] = useState("");
    const [courseNumber, setCourseNumber] = useState("");
    const query = api.prereqsWithOfferings.getCoursePrereqs.useQuery({
        department,
        courseNumber,
    });

    const columns: ColumnDef<PrereqRow>[] = [
        {
            accessorKey: "department",
            header: "Department",
            cell: (info: CellContext<PrereqRow, unknown>) => String(info.getValue()),
        },
        {
            accessorKey: "courseNumber",
            header: "Course Number",
            cell: (info: CellContext<PrereqRow, unknown>) => String(info.getValue()),
        },
        {
            accessorKey: "minGrade",
            header: "Min Grade",
            cell: (info: CellContext<PrereqRow, unknown>) => info.getValue() ?? "-",
        },
        {
            accessorKey: "fall",
            header: "Fall",
            cell: (info: CellContext<PrereqRow, unknown>) => (info.row.original.fall ? "✔️" : ""),
        },
        {
            accessorKey: "winter",
            header: "Winter",
            cell: (info: CellContext<PrereqRow, unknown>) => (info.row.original.winter ? "✔️" : ""),
        },
        {
            accessorKey: "spring",
            header: "Spring",
            cell: (info: CellContext<PrereqRow, unknown>) => (info.row.original.spring ? "✔️" : ""),
        },
    ];

    const table = useReactTable<PrereqRow>({
        data: query.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Test Prerequisite Query</h1>
            <form onSubmit={e => { e.preventDefault(); }} className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Department (e.g. MATH)"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="border px-2 py-1 rounded"
                    required
                />
                <input
                    type="text"
                    placeholder="Course Number (e.g. 101)"
                    value={courseNumber}
                    onChange={e => setCourseNumber(e.target.value)}
                    className="border px-2 py-1 rounded"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Fetch</button>
            </form>
            {query.isLoading && <div>Loading...</div>}
            {query.error && <div className="text-red-600">{query.error.message || "Failed to fetch prerequisites."}</div>}
            {table.getRowModel().rows.length > 0 && (
                <table className="w-full border border-gray-300 rounded-lg overflow-hidden shadow">
                    <thead className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup: HeaderGroup<PrereqRow>) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-4 py-2 text-left font-semibold border-b">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row: Row<PrereqRow>) => (
                            <tr key={row.id} className="hover:bg-blue-50">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-4 py-2 border-b">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
