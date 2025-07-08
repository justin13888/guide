import { NextResponse } from 'next/server';
import { db } from "~/server/db";

export async function GET(
) {
  try {
    const departments = await db.execute(
      `SELECT department, COUNT(*) FROM courses GROUP BY department ORDER BY COUNT(*) DESC`
    );

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
} 