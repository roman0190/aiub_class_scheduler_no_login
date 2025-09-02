"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

// Define proper types for the shared schedule data
interface CourseScheduleSlot {
  day: string;
  timeStart: string;
  timeEnd: string;
  type: string;
  room: string;
}

interface SharedCourse {
  title: string;
  classId: string;
  count?: string;
  capacity?: string;
  schedule: CourseScheduleSlot[];
}

interface SharedScheduleData {
  courses: SharedCourse[];
  variant: number;
  timestamp: number;
}

interface ScheduleItem {
  course: SharedCourse;
  day: string;
  timeStart: string;
  timeEnd: string;
  type: string;
  room: string;
  displayTime: string;
}

const SharedScheduleContent = () => {
  const searchParams = useSearchParams();
  const [scheduleData, setScheduleData] = useState<SharedScheduleData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sharedSchedule = searchParams.get("schedule");

    if (sharedSchedule) {
      try {
        const decodedSchedule = JSON.parse(decodeURIComponent(sharedSchedule));
        console.log("Shared Schedule Loaded:", decodedSchedule);
        setScheduleData(decodedSchedule);
        setLoading(false);
      } catch (error) {
        console.error("Error loading shared schedule:", error);
        setError("Invalid or corrupted share link");
        setLoading(false);
      }
    } else {
      setError("No schedule data found in the link");
      setLoading(false);
    }
  }, [searchParams]);

  // Convert time string to minutes for better sorting and display
  const timeToMinutes = (time: string): number => {
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr.split(" ")[0]);

    if (time.includes("PM") && hour !== 12) {
      hour += 12;
    } else if (time.includes("AM") && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  };

  // Generate professional calendar colors
  const generateColor = (title: string) => {
    const colors = [
      { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-50" },
      {
        bg: "bg-emerald-500",
        border: "border-emerald-600",
        text: "text-emerald-50",
      },
      {
        bg: "bg-purple-500",
        border: "border-purple-600",
        text: "text-purple-50",
      },
      {
        bg: "bg-orange-500",
        border: "border-orange-600",
        text: "text-orange-50",
      },
      { bg: "bg-pink-500", border: "border-pink-600", text: "text-pink-50" },
      {
        bg: "bg-indigo-500",
        border: "border-indigo-600",
        text: "text-indigo-50",
      },
      { bg: "bg-teal-500", border: "border-teal-600", text: "text-teal-50" },
      { bg: "bg-red-500", border: "border-red-600", text: "text-red-50" },
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash + title.charCodeAt(i) * (i + 1)) % colors.length;
    }
    return colors[hash];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading shared schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Main Page
          </Link>
        </div>
      </div>
    );
  }

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Group courses by day
  const scheduleByDay: Record<string, ScheduleItem[]> = {};
  daysOfWeek.forEach((day) => {
    scheduleByDay[day] = [];
  });

  scheduleData?.courses?.forEach((course: SharedCourse) => {
    course.schedule?.forEach((slot: CourseScheduleSlot) => {
      scheduleByDay[slot.day]?.push({
        course,
        ...slot,
        displayTime: `${slot.timeStart}-${slot.timeEnd}`,
      });
    });
  });

  // Sort by time
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => {
      const timeA = a.timeStart.replace(/[^\d]/g, "");
      const timeB = b.timeStart.replace(/[^\d]/g, "");
      return parseInt(timeA) - parseInt(timeB);
    });
  });

  const uniqueCourses = [
    ...new Set(scheduleData?.courses?.map((c: SharedCourse) => c.title) || []),
  ] as string[];

  // Generate time slots for calendar view (more compact)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      const timeStr = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
      slots.push({ hour, timeStr });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate position and height for calendar blocks (smaller scale)
  const getEventStyle = (timeStart: string, timeEnd: string) => {
    const startMinutes = timeToMinutes(timeStart);
    const endMinutes = timeToMinutes(timeEnd);

    // Position relative to 8 AM start (40px per hour instead of 60px)
    const top = ((startMinutes - 8 * 60) / 60) * 40;
    const height = Math.max(((endMinutes - startMinutes) / 60) * 40, 25); // minimum 25px height

    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="min-h-screen bg-[#f0f8ff] text-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 mb-1">
                📅 Shared Schedule Option {scheduleData?.variant}
              </h1>
              <p className="text-sm text-gray-600">
                Someone shared this schedule with you - {uniqueCourses.length}{" "}
                courses included
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const shareUrl = window.location.href;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    Swal.fire({
                      icon: "success",
                      title: "Link Copied!",
                      text: "Share this link with others!",
                      timer: 2000,
                    });
                  });
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
              >
                📋 Copy
              </button>

              <Link
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
              >
                🏠 Back
              </Link>
            </div>
          </div>
        </div>

        {/* Google Calendar Style Schedule Display */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Weekly Schedule
            </h2>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 bg-gray-50 border-r text-xs font-medium text-gray-600">
                  Time
                </div>
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-2 bg-gray-50 border-r last:border-r-0 text-center font-semibold text-sm text-gray-700"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              <div className="relative">
                {/* Time labels column */}
                <div className="absolute left-0 top-0 w-[12.5%] bg-gray-50 border-r h-full">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.hour}
                      className="h-10 border-b flex items-center justify-center text-xs text-gray-500 font-medium"
                    >
                      {slot.timeStr}
                    </div>
                  ))}
                </div>

                {/* Days columns */}
                <div className="ml-[12.5%] grid grid-cols-7">
                  {daysOfWeek.map((day) => {
                    const daySchedule = scheduleByDay[day];
                    return (
                      <div
                        key={day}
                        className="relative border-r last:border-r-0 min-h-[440px]"
                      >
                        {/* Time grid background */}
                        {timeSlots.map((slot) => (
                          <div
                            key={slot.hour}
                            className="h-10 border-b border-gray-100"
                          />
                        ))}

                        {/* Course events */}
                        {daySchedule.map((item, idx) => {
                          const courseColor = generateColor(item.course.title);
                          const style = getEventStyle(
                            item.timeStart,
                            item.timeEnd
                          );

                          // Extract course name and section from title
                          const courseName = item.course.title.split(" [")[0];
                          const sectionMatch =
                            item.course.title.match(/\[([A-Z0-9]+)\]/);
                          const section = sectionMatch ? sectionMatch[1] : "";

                          return (
                            <div
                              key={idx}
                              className={`absolute left-0.5 right-0.5 ${courseColor.bg} ${courseColor.border} border-l-3 rounded-r shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden`}
                              style={style}
                            >
                              <div className="p-1.5 h-full">
                                <div
                                  className={`text-xs font-bold ${courseColor.text} leading-tight mb-0.5`}
                                >
                                  {courseName.length > 18
                                    ? courseName.substring(0, 18) + "..."
                                    : courseName}
                                </div>
                                {section && (
                                  <div
                                    className={`text-xs ${courseColor.text} opacity-95 font-semibold`}
                                  >
                                    Section: {section}
                                  </div>
                                )}
                                <div
                                  className={`text-xs ${courseColor.text} opacity-90`}
                                >
                                  {item.displayTime}
                                </div>
                                <div
                                  className={`text-xs ${courseColor.text} opacity-85`}
                                >
                                  {item.room}
                                </div>
                              </div>

                              {/* Enhanced hover tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                                <div className="bg-black text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                                  <div className="font-bold text-yellow-300 mb-1">
                                    {courseName}
                                  </div>
                                  {section && (
                                    <div className="font-semibold text-blue-300">
                                      Section: {section}
                                    </div>
                                  )}
                                  <div className="text-gray-300">
                                    {item.type} • Room: {item.room}
                                  </div>
                                  <div className="text-gray-300">
                                    {item.displayTime}
                                  </div>
                                  {item.course.count &&
                                    item.course.capacity && (
                                      <div className="text-green-300">
                                        Enrolled: {item.course.count}/
                                        {item.course.capacity}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Legend */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Course Legend</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCourses.map((course: string, idx) => {
              const courseColor = generateColor(course);
              return (
                <span
                  key={idx}
                  className={`${courseColor.bg} ${courseColor.text} px-2 py-1 rounded text-xs font-medium flex items-center gap-1`}
                >
                  <span className="w-2 h-2 bg-white rounded-full opacity-80"></span>
                  {course.length > 25
                    ? course.substring(0, 25) + "..."
                    : course}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">
              Want to create your own schedule?
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Upload your course file and create personalized schedules with our
              intelligent scheduler
            </p>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 inline-block text-sm"
            >
              🚀 Create Your Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const SharedSchedulePage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading shared schedule...</p>
          </div>
        </div>
      }
    >
      <SharedScheduleContent />
    </Suspense>
  );
};

export default SharedSchedulePage;
