'use client';
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function PrereqsPage() {
    const [department, setDepartment] = useState("");
    const [courseNumber, setCourseNumber] = useState("");
    const query = api.prereqsWithOfferings.getCoursePrereqs.useQuery({
        department,
        courseNumber,
    });

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrereqs = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await query.refetch();
            setResults(data.data ?? []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch prerequisites.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("Query data:", query.data);
    }, [query.data]);

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Test Prerequisite Query</h1>
            <form onSubmit={fetchPrereqs} className="mb-6 flex gap-2">
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
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {results.length > 0 && (
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
                        {results.map((row, idx) => (
                            <tr key={idx}>
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
