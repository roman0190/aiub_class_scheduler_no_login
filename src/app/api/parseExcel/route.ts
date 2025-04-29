import * as xlsx from "xlsx";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Function to handle POST request and file parsing
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request to extract the file
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Please upload an Excel file" },
        { status: 400 }
      );
    }

    // Read the file buffer (Excel file content)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse the Excel file with xlsx
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });

    // Verify that the workbook has at least one sheet
    if (workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Assuming the data is in the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON format (each row will be an array)
    const data = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Add error handling for empty data
    if (data.length <= 1) {
      return NextResponse.json(
        { error: "No data found in Excel file" },
        { status: 400 }
      );
    }

    const courses: Course[] = [];
    let currentCourse: Course | null = null;

    // Process each row of data into the required format
    for (let i = 1; i < data.length; i++) {
      const row: any[] = data[i];
      if (!row[0]) continue; // Skip empty rows

      const classId = row[0];//id
      const title = row[5]; // Course Title
      const status = row[2]; //status
      const capacity = row[3]; // Capacity
      const count = row[4]; // Count

      // Check if the current row belongs to the same course
      if (currentCourse && currentCourse.classId === classId) {
        currentCourse.schedule.push({
          type: row[8], // Type (Theory, Lab, etc.)
          day: row[9], // Day
          timeStart: row[10], // Start Time
          timeEnd: row[11], // End Time
          room: row[12], // Room
        });
      } else {
        if (currentCourse) {
          courses.push(currentCourse); // Push the last course if it exists
        }

        // Start a new course
        currentCourse = {
          classId,
          title,
          status,
          capacity,
          count,
          schedule: [
            {
              type: row[8], // Type (Lecture, Tutorial, etc.)
              day: row[9], // Day
              timeStart: row[10], // Start Time
              timeEnd: row[11], // End Time
              room: row[12], // Room
            },
          ],
        };
      }
    }

    // Push the last course into the final array
    if (currentCourse) {
      courses.push(currentCourse);
    }

    // Return the formatted courses with a success message
    return NextResponse.json(
      {
        message: "File processed successfully",
        data: courses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return NextResponse.json(
      { error: "Failed to parse Excel file" },
      { status: 500 }
    );
  }
}
