import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  HeadingLevel,
} from "docx";

// Format time for better display in Word
const formatTimeDisplay = (time: string) => {
  return time.replace("-", " - ");
};

// Convert time string to minutes for sorting (e.g., "8:30 AM" -> minutes since midnight)
const timeToMinutes = (timeStr: string): number => {
  // Extract hours and minutes
  const [time, period] = timeStr.trim().split(" ");
  let hours;
  const minutes = time.split(":").map(Number)[1];
  hours = time.split(":").map(Number)[0];

  // Convert to 24-hour format
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Create a styled paragraph
const createStyledParagraph = (
  text: string,
  bold: boolean = false,
  size: number = 24
) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size,
      }),
    ],
  });
};

// Create header cell with styling
const createHeaderCell = (text: string) => {
  return new TableCell({
    width: {
      size: 100 / 3,
      type: WidthType.PERCENTAGE,
    },
    shading: {
      fill: "EEEEEE",
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
          }),
        ],
      }),
    ],
  });
};

// Create a data cell with styling
const createDataCell = (text: string) => {
  return new TableCell({
    width: {
      size: 100 / 3,
      type: WidthType.PERCENTAGE,
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text })],
      }),
    ],
  });
};

// Export schedule to Word document
export const exportToWord = async (
  scheduleData: CourseInSchedule[],
  variantIdx: number
) => {
  // Group courses by day
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const coursesByDay: Record<
    string,
    Array<{
      title: string;
      type: string;
      time: string;
      room: string;
    }>
  > = {};

  // Initialize all days
  daysOfWeek.forEach((day) => {
    coursesByDay[day] = [];
  });

  // Organize courses by day
  scheduleData.forEach((course) => {
    course.schedule.forEach((slot) => {
      coursesByDay[slot.day].push({
        title: course.title,
        type: slot.type || "Theory",
        time: `${slot.timeStart} - ${slot.timeEnd}`,
        room: slot.room,
      });
    });
  });

  // Sort courses by time for each day
  Object.keys(coursesByDay).forEach((day) => {
    coursesByDay[day].sort((a, b) => {
      const timeAStart = a.time.split(" - ")[0];
      const timeBStart = b.time.split(" - ")[0];

      // Convert to minutes for proper chronological sorting
      const minutesA = timeToMinutes(timeAStart);
      const minutesB = timeToMinutes(timeBStart);

      return minutesA - minutesB;
    });
  });

  // Create document sections
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: `Course Schedule Option ${variantIdx + 1}`,
                bold: true,
                size: 36,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Summary
          createStyledParagraph(
            `Total Courses: ${scheduleData.length}`,
            true,
            28
          ),
          createStyledParagraph("Weekly Schedule:", true, 28),

          // Create a table for each day
          ...daysOfWeek.flatMap((day) => {
            const courses = coursesByDay[day];

            if (courses.length === 0) {
              return [
                // Day header
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [
                    new TextRun({
                      text: day,
                      bold: true,
                      size: 28,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                // No classes message
                createStyledParagraph("No classes scheduled", false, 24),
                // Add spacing
                new Paragraph({ spacing: { after: 200 } }),
              ];
            }

            // Create table for this day
            const table = new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    createHeaderCell("Course"),
                    createHeaderCell("Time"),
                    createHeaderCell("Room"),
                  ],
                }),
                // Data rows
                ...courses.map(
                  (course) =>
                    new TableRow({
                      children: [
                        createDataCell(`${course.title} (${course.type})`),
                        createDataCell(formatTimeDisplay(course.time)),
                        createDataCell(course.room),
                      ],
                    })
                ),
              ],
            });

            return [
              // Day header
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: day,
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              // Table
              table,
              // Add spacing
              new Paragraph({ spacing: { after: 200 } }),
            ];
          }),
        ],
      },
    ],
  });

  // Generate the document and return it
  const blob = await Packer.toBlob(doc);
  return blob;
};
