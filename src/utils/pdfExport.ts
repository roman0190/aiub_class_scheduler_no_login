import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Format time for better display
const formatTimeDisplay = (time: string) => {
  return time.replace("-", " - ");
};

// Convert time string to minutes for sorting
const timeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.trim().split(" ");
  let hours;
  const minutes = time.split(":").map(Number)[1];
  hours = time.split(":").map(Number)[0];

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const exportToPDF = async (
  scheduleData: CourseInSchedule[],
  variantIdx: number
) => {
  try {
    if (typeof window === "undefined") {
      throw new Error(
        "PDF generation is only available in browser environment"
      );
    }

    // Initialize PDF document
    const doc = new jsPDF();

    // Add autoTable plugin to jsPDF instance
    if (typeof doc.autoTable !== "function") {
      doc.autoTable = autoTable;
    }

    let yPos = 20;

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Course Schedule Option ${variantIdx + 1}`, 20, yPos);
    yPos += 10;

    // Add website URL
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(0, 0, 255);
    doc.text(
      "Visit: www.aiubclassscheduler.me OR https://aiub-class-scheduler-no-login.vercel.app/",
      20,
      yPos
    );
    yPos += 10;

    // Add note
    doc.setTextColor(255, 0, 0);
    doc.text(
      "Note: Please verify this schedule with the official AIUB website for accuracy.",
      20,
      yPos
    );
    yPos += 15;

    // Reset text color to black
    doc.setTextColor(0, 0, 0);

    // Add total courses
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Courses: ${scheduleData.length}`, 20, yPos);
    yPos += 10;

    // Group courses by day
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const coursesByDay: Record<
      string,
      Array<{
        title: string;
        type: string;
        time: string;
        room: string;
        count?: string;
        capacity?: string;
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
          count: course.count,
          capacity: course.capacity,
        });
      });
    });

    // Sort courses by time for each day
    Object.keys(coursesByDay).forEach((day) => {
      coursesByDay[day].sort((a, b) => {
        const timeAStart = a.time.split(" - ")[0];
        const timeBStart = b.time.split(" - ")[0];
        return timeToMinutes(timeAStart) - timeToMinutes(timeBStart);
      });
    });

    // Create tables for each day
    daysOfWeek.forEach((day) => {
      const courses = coursesByDay[day];

      // Add day header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      yPos += 10;

      // Check if new page is needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(day, 20, yPos);
      yPos += 10;

      if (courses.length === 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("No classes scheduled", 20, yPos);
        yPos += 10;
      } else {
        // Create table for courses
        const tableData = courses.map((course) => [
          `${course.title} (${course.type})`,
          formatTimeDisplay(course.time),
          course.room,
          `${course.count || "N/A"} / ${course.capacity || "N/A"}`,
        ]);

        // @ts-expect-error - jspdf-autotable types are not properly recognized
        doc.autoTable({
          startY: yPos,
          head: [["Course", "Time", "Room", "Enrollment (Count/Capacity)"]],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          margin: { left: 20 },
          styles: { fontSize: 10 },
        });

        // Update yPos after table
        // @ts-expect-error - accessing internal property
        yPos = doc.lastAutoTable.finalY + 10;
      }
    });

    // Return the PDF as a blob
    return doc.output("blob");
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw new Error("Failed to generate PDF: " + (error as Error).message);
  }
};
