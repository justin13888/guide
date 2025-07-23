'use client';
import { useState } from "react";
import { api } from "~/trpc/react";

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
            {query.data && query.data.length > 0 && (
                <table className="w-full border">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Course Number</th>
                            <th>Min Grade</th>
                            <th>Fall</th>
                            <th>Winter</th>
                            <th>Spring</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(query.data as PrereqRow[]).map(row => (
                            <tr key={`${row.department}-${row.courseNumber}`}>
                                <td>{row.department}</td>
                                <td>{row.courseNumber}</td>
                                <td>{row.minGrade ?? '-'}</td>
                                <td>{row.fall ? '✔️' : ''}</td>
                                <td>{row.winter ? '✔️' : ''}</td>
                                <td>{row.spring ? '✔️' : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
