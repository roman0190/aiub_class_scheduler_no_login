import React, { useState, useEffect, useMemo, useCallback } from "react";

// Convert time string to numerical value for easier comparison
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

// Improved function to generate more accurate time slots
const generateTimeSlots = (courses: Course[]) => {
  // Set default time range if no courses are selected
  let minTime = 8 * 60; // 8:00 AM
  let maxTime = 18 * 60; // 6:00 PM

  // Iterate through the courses and find the min start time and max end time
  if (courses.length > 0) {
    minTime = Number.MAX_SAFE_INTEGER;
    maxTime = 0;

    courses.forEach((course) => {
      course.schedule.forEach((schedule) => {
        const startTime = timeToMinutes(schedule.timeStart);
        const endTime = timeToMinutes(schedule.timeEnd);

        minTime = Math.min(minTime, startTime);
        maxTime = Math.max(maxTime, endTime);
      });
    });

    // Add some padding
    minTime = Math.max(0, minTime - 30);
    maxTime = maxTime + 30;
  }

  // Generate the time slots array dynamically
  const timeSlots = [];
  let currentTime = minTime;

  // Use shorter slots for better precision (45 minutes)
  const slotDuration = 45;

  while (currentTime < maxTime) {
    const startHour = Math.floor(currentTime / 60);
    const startMinute = currentTime % 60;
    const endTime = currentTime + slotDuration;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;

    const startTimeStr = `${startHour % 12 || 12}:${String(
      startMinute
    ).padStart(2, "0")} ${startHour < 12 ? "AM" : "PM"}`;
    const endTimeStr = `${endHour % 12 || 12}:${String(endMinute).padStart(
      2,
      "0"
    )} ${endHour < 12 ? "AM" : "PM"}`;

    timeSlots.push(`${startTimeStr} - ${endTimeStr}`);
    currentTime = endTime;
  }

  return timeSlots;
};

// Enhanced function to check if two schedules conflict with detailed reason
const checkConflictWithReason = (
  schedule1: TimeSchedule[],
  schedule2: TimeSchedule[]
): { hasConflict: boolean; reason?: string } => {
  for (const slot1 of schedule1) {
    for (const slot2 of schedule2) {
      if (slot1.day === slot2.day) {
        // Convert times to minutes for proper numerical comparison
        const start1 = timeToMinutes(slot1.timeStart);
        const end1 = timeToMinutes(slot1.timeEnd);
        const start2 = timeToMinutes(slot2.timeStart);
        const end2 = timeToMinutes(slot2.timeEnd);

        // Check for overlap using numerical comparison
        if (start1 < end2 && end1 > start2) {
          return {
            hasConflict: true,
            reason: `Time overlap on ${slot1.day} (${slot1.timeStart}-${slot1.timeEnd} conflicts with ${slot2.timeStart}-${slot2.timeEnd})`,
          };
        }
      }
    }
  }
  return { hasConflict: false };
};

// Update the original checkConflict to use the new function
const checkConflict = (
  schedule1: TimeSchedule[],
  schedule2: TimeSchedule[]
): boolean => {
  return checkConflictWithReason(schedule1, schedule2).hasConflict;
};

// Calculate a score for a schedule based on gaps between classes
const calculateScheduleScore = (schedule: Course[]): number => {
  // Group classes by day to calculate gaps
  const classesByDay: Record<
    string,
    Array<{ start: number; end: number }>
  > = {};

  // First, collect all class times by day
  schedule.forEach((course) => {
    course.schedule.forEach((slot) => {
      const day = slot.day;
      const startTime = timeToMinutes(slot.timeStart);
      const endTime = timeToMinutes(slot.timeEnd);

      if (!classesByDay[day]) {
        classesByDay[day] = [];
      }

      classesByDay[day].push({
        start: startTime,
        end: endTime,
      });
    });
  });

  // Calculate gaps for each day
  let totalGapMinutes = 0;
  let totalGaps = 0;

  Object.values(classesByDay).forEach((dayClasses) => {
    // Sort classes by start time
    dayClasses.sort((a, b) => a.start - b.start);

    // Calculate gaps between classes
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const currentEnd = dayClasses[i].end;
      const nextStart = dayClasses[i + 1].start;

      const gap = nextStart - currentEnd;

      // Count all gaps
      if (gap > 0) {
        totalGapMinutes += gap;
        totalGaps++;
      }
    }
  });

  // Calculate course coverage (percentage of requested courses included)
  const uniqueCoursesCount = new Set(schedule.map((course) => course.title))
    .size;

  // Calculate average gap in minutes (if there are gaps)
  const avgGap = totalGaps > 0 ? totalGapMinutes / totalGaps : 0;

  // Assign a penalty for gaps based on their size - higher penalty for bigger gaps
  const gapPenalty = Math.pow(avgGap, 1.5) * totalGaps;

  // Lower score is better (we want to minimize gaps and maximize coverage)
  // Increased weight for unique courses while adding stronger penalty for gaps
  return gapPenalty - uniqueCoursesCount * 1000;
};

// Update the ranking algorithm to balance class types across different days
const rankScheduleQuality = (
  schedule: CourseInSchedule[]
): {
  score: number;
  metrics: {
    courseCount: number;
    gapScore: number;
    balancedDays: number;
    earlyClasses: number;
    compactness: number;
    mixPattern: number; // New metric for mixed class types
  };
} => {
  const uniqueCourses = [...new Set(schedule.map((c) => c.title))];
  const courseCount = uniqueCourses.length;

  // Group classes by day
  const classesByDay: Record<
    string,
    Array<{ start: number; end: number; title: string; type: string }>
  > = {};
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  daysOfWeek.forEach((day) => {
    classesByDay[day] = [];
  });

  // Collect all classes by day
  schedule.forEach((course) => {
    course.schedule.forEach((slot) => {
      classesByDay[slot.day].push({
        start: timeToMinutes(slot.timeStart),
        end: timeToMinutes(slot.timeEnd),
        title: course.title,
        type: slot.type || "Theory", // Default to Theory if type is not specified
      });
    });
  });

  // Calculate average gap between classes
  let totalGap = 0;
  let gapCount = 0;
  let dayWithClasses = 0;
  let earlyMorningClasses = 0; // Classes before 9 AM
  let daySpread = 0; // Track how many days have classes
  let totalTimeInSchool = 0; // Track total time from first to last class each day
  let mixPatternScore = 0; // Score for mixed pattern of class types

  Object.entries(classesByDay).forEach(([, classes]) => {
    if (classes.length > 0) {
      dayWithClasses++;
      daySpread++;

      // Sort classes by start time
      classes.sort((a, b) => a.start - b.start);

      // Count early morning classes
      classes.forEach((cls) => {
        if (cls.start < 9 * 60) {
          // Before 9 AM
          earlyMorningClasses++;
        }
      });

      // Calculate total time from first class to last class
      const firstClass = classes[0].start;
      const lastClass = classes[classes.length - 1].end;
      const dayDuration = lastClass - firstClass;
      totalTimeInSchool += dayDuration;

      // Calculate gaps
      for (let i = 0; i < classes.length - 1; i++) {
        const gap = classes[i + 1].start - classes[i].end;
        if (gap > 0) {
          totalGap += gap;
          gapCount++;
        }
      }

      // NEW: Calculate mix pattern score
      // Higher score when theory and lab classes are mixed on the same day
      // rather than having all theory or all lab sections
      if (classes.length > 1) {
        const classTypes = classes.map((c) => c.type);
        const hasTheory = classTypes.includes("Theory");
        const hasLab = classTypes.includes("Lab");

        // If this day has both theory and lab classes, increase mix score
        if (hasTheory && hasLab) {
          // Check if there's alternating pattern (even better)
          let alternating = true;
          for (let i = 1; i < classes.length; i++) {
            if (classes[i].type === classes[i - 1].type) {
              alternating = false;
              break;
            }
          }

          // Higher score for alternating pattern (Theory-Lab-Theory or Lab-Theory-Lab)
          mixPatternScore += alternating ? 20 : 10;
        }
      }
    }
  });

  // Calculate metrics
  const avgGap = gapCount > 0 ? totalGap / gapCount : 0;

  // Calculate compactness score - ratio of actual class time to total time in school
  let totalClassTime = 0;
  schedule.forEach((course) => {
    course.schedule.forEach((slot) => {
      const duration =
        timeToMinutes(slot.timeEnd) - timeToMinutes(slot.timeStart);
      totalClassTime += duration;
    });
  });

  const compactness =
    totalTimeInSchool > 0 ? (totalClassTime / totalTimeInSchool) * 100 : 100;

  // Normalize mix pattern score based on number of days with classes
  const normalizedMixScore =
    dayWithClasses > 0 ? mixPatternScore / dayWithClasses : 0;

  // Ideal gap is around 10-15 minutes (too small is bad, too large is inefficient)
  let gapScore = 100;
  if (avgGap < 10) {
    gapScore -= (10 - avgGap) * 3; // Small penalty for very tight transitions
  } else if (avgGap > 20) {
    gapScore -= (avgGap - 20) * 2; // Larger penalty for bigger gaps
  }

  // Balance of days (better to have classes spread out evenly)
  const coursesPerDay = courseCount / (dayWithClasses || 1);
  const balancedDays = daySpread * 10 - Math.abs(coursesPerDay - 3) * 5;

  // Penalty for early morning classes
  const earlyClassPenalty = earlyMorningClasses * 15;

  // Calculate final score (higher is better)
  // Include mix pattern in the score
  const score =
    courseCount * 150 + // Still prioritize number of courses most
    gapScore + // Gap score
    balancedDays + // Day balance score
    compactness * 0.8 + // Reward compact schedules with less time wasted
    normalizedMixScore * 15 - // Reward schedules with mixed class types
    earlyClassPenalty; // Early morning penalty

  return {
    score,
    metrics: {
      courseCount,
      gapScore,
      balancedDays,
      earlyClasses: earlyMorningClasses,
      compactness,
      mixPattern: normalizedMixScore,
    },
  };
};

// Enhanced version of the scheduler that generates multiple variants (up to 20)
const getValidCourseVariants = (courses: { [key: string]: Course[] }) => {
  const MAX_VARIANTS = 20; // Maximum number of schedule variants to generate
  const MAX_KEPT_VARIANTS = 20; // Number of final best schedules to keep (increased from 8)

  // Pre-calculate section conflicts
  const conflictCache: Record<string, Record<string, boolean>> = {};
  const conflictCounts: Record<string, number> = {};

  const courseTitles = Object.keys(courses);
  const getSectionKey = (section: Course) => section.classId;

  // Build map of available sections for each course
  const courseSectionsMap: { [title: string]: Course[] } = {};
  courseTitles.forEach((title) => {
    // Sort sections by enrollment count - prioritize sections with lower enrollment
    const sortedSections = [...courses[title]].sort((a, b) => {
      // If count and capacity are available, compare enrollment percentage
      if (a.count && a.capacity && b.count && b.capacity) {
        const aFillRate = parseInt(a.count) / parseInt(a.capacity);
        const bFillRate = parseInt(b.count) / parseInt(b.capacity);
        return aFillRate - bFillRate; // Lower fill rate (less full) first
      }
      // If only count is available for both, compare them
      if (a.count && b.count) {
        return parseInt(a.count) - parseInt(b.count);
      }
      // If count only exists for one, prioritize the one with count info
      if (a.count) return -1;
      if (b.count) return 1;
      return 0;
    });

    // Use the sorted sections (with lower enrollment first)
    courseSectionsMap[title] = sortedSections;
    conflictCounts[title] = 0;
  });

  // Pre-calculate conflicts between all sections
  for (const title1 of courseTitles) {
    for (const section1 of courseSectionsMap[title1]) {
      const key1 = getSectionKey(section1);
      conflictCache[key1] = conflictCache[key1] || {};

      for (const title2 of courseTitles) {
        if (title1 === title2) continue;

        for (const section2 of courseSectionsMap[title2]) {
          const key2 = getSectionKey(section2);

          if (conflictCache[key1][key2] === undefined) {
            const hasConflict = checkConflict(
              section1.schedule,
              section2.schedule
            );
            conflictCache[key1][key2] = hasConflict;
            conflictCache[key2] = conflictCache[key2] || {};
            conflictCache[key2][key1] = hasConflict;

            // Count conflicts
            if (hasConflict) {
              conflictCounts[title1]++;
              conflictCounts[title2]++;
            }
          }
        }
      }
    }
  }

  // Sort courses by conflict count (most conflicted first)
  const sortedCourseTitles = [...courseTitles].sort(
    (a, b) => conflictCounts[b] - conflictCounts[a]
  );

  // Store all valid schedules we find
  const allSchedules: Course[][] = [];
  // Keep track of unique schedules with a fingerprint
  const scheduleFingerprints = new Set<string>();

  // Enhanced schedule builder - try more combinations to generate more diverse options
  const buildSchedule = (currentIdx: number, currentSchedule: Course[]) => {
    // Stop if we already found enough schedule variants
    if (allSchedules.length >= MAX_VARIANTS) return;

    // If we've processed all courses, save this schedule
    if (currentIdx >= sortedCourseTitles.length) {
      if (currentSchedule.length > 0) {
        // Create a unique fingerprint for this schedule
        const fingerprint = currentSchedule
          .map((course) => `${course.title}:${course.classId}`)
          .sort()
          .join("|");

        // Only add if we don't have this exact schedule already
        if (!scheduleFingerprints.has(fingerprint)) {
          scheduleFingerprints.add(fingerprint);
          allSchedules.push([...currentSchedule]);
        }
      }
      return;
    }

    const courseTitle = sortedCourseTitles[currentIdx];
    const sections = courseSectionsMap[courseTitle];

    // Get the days and types of existing classes in the schedule
    const existingClassesByDay: Record<
      string,
      { type: string; count: number }[]
    > = {};
    daysOfWeek.forEach((day) => {
      existingClassesByDay[day] = [];
    });

    currentSchedule.forEach((course) => {
      course.schedule.forEach((slot) => {
        const day = slot.day;
        const type = slot.type || "Theory";

        const existingTypes = existingClassesByDay[day].map(
          (item) => item.type
        );
        const typeIndex = existingTypes.indexOf(type);

        if (typeIndex >= 0) {
          existingClassesByDay[day][typeIndex].count++;
        } else {
          existingClassesByDay[day].push({ type, count: 1 });
        }
      });
    });

    // Sort sections to prioritize those that create a better mix pattern
    // This means different types on different days, or alternating types on the same day
    const sortedSections = [...sections].sort((a, b) => {
      // Calculate mix score for each section
      const sectionAScore = calculateSectionMixScore(a, existingClassesByDay);
      const sectionBScore = calculateSectionMixScore(b, existingClassesByDay);

      // Higher score is better
      return sectionBScore - sectionAScore;
    });

    // Try all sections for this course - important to try every section

    // Iterate through the sorted sections
    for (const section of sortedSections) {
      // Check if this section conflicts with any current ones
      let hasConflict = false;

      for (const existingCourse of currentSchedule) {
        const sectionKey1 = getSectionKey(section);
        const sectionKey2 = getSectionKey(existingCourse);

        if (conflictCache[sectionKey1][sectionKey2]) {
          hasConflict = true;
          break;
        }
      }

      // If no conflicts, add this section and continue with next course
      if (!hasConflict) {
        // Try this section
        buildSchedule(currentIdx + 1, [...currentSchedule, section]);
        // If we've found enough schedules, stop trying more sections
        if (allSchedules.length >= MAX_VARIANTS) break;
      }
    }

    // Still try skipping if needed for diversity
    if (currentIdx < sortedCourseTitles.length - 1) {
      buildSchedule(currentIdx + 1, currentSchedule);
    }
  };

  // Helper function to score sections based on how well they mix with existing schedule
  function calculateSectionMixScore(
    section: Course,
    existingClassesByDay: Record<string, { type: string; count: number }[]>
  ): number {
    let score = 0;

    section.schedule.forEach((slot) => {
      const day = slot.day;
      const type = slot.type || "Theory";

      const existingTypesOnDay = existingClassesByDay[day];

      // If there are no classes on this day yet, this is neutral
      if (existingTypesOnDay.length === 0) {
        score += 5;
      }
      // If there are only classes of the same type, adding a different type is good
      else if (!existingTypesOnDay.some((item) => item.type === type)) {
        score += 10; // Encourage different types on the same day
      }
      // If there's already alternating pattern, try to maintain it
      else if (
        existingTypesOnDay.length >= 2 &&
        existingTypesOnDay.some((item) => item.type !== type)
      ) {
        score += 8;
      }
      // If adding more of the same type that already exists, less preferable
      else {
        score += 2;
      }
    });

    return score;
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

  // Start with an empty schedule
  buildSchedule(0, []);

  // If no schedules found, try generating at least one by prioritizing the least conflicting courses
  if (allSchedules.length === 0) {
    console.log("No valid combinations found, generating partial schedules");

    // Sort courses by number of conflicts (least conflicts first)
    const nonConflictingFirst = [...courseTitles].sort(
      (a, b) => conflictCounts[a] - conflictCounts[b]
    );

    const greedySchedule: Course[] = [];

    // Build a schedule by adding courses one by one if they don't conflict
    for (const courseTitle of nonConflictingFirst) {
      // Try each section
      let bestSection: Course | null = null;

      for (const section of courseSectionsMap[courseTitle]) {
        let hasConflict = false;

        // Check against existing courses in the schedule
        for (const existingCourse of greedySchedule) {
          if (checkConflict(section.schedule, existingCourse.schedule)) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          bestSection = section;
          break;
        }
      }

      // Add the best non-conflicting section if found
      if (bestSection) {
        greedySchedule.push(bestSection);
      }
    }

    // Add this greedy schedule if we found any courses
    if (greedySchedule.length > 0) {
      allSchedules.push(greedySchedule);
    }
  }

  console.log(
    `Found ${allSchedules.length} potential schedules before filtering`
  );

  // Score and filter schedules to keep only the best and most diverse ones
  const scoredSchedules = allSchedules.map((schedule) => ({
    schedule,
    score: calculateScheduleScore(schedule),
    // Track which courses are included for diversity
    includedCourses: new Set(schedule.map((course) => course.title)),
  }));

  // Sort by score (lower is better)
  scoredSchedules.sort((a, b) => a.score - b.score);

  // Keep the best schedules but ensure diversity (different combinations of courses)
  const selectedSchedules: Course[][] = [];
  const selectedCoursesCombinations = new Set<string>();

  // First add the best schedule
  if (scoredSchedules.length > 0) {
    selectedSchedules.push(scoredSchedules[0].schedule);
    selectedCoursesCombinations.add(
      [...scoredSchedules[0].includedCourses].sort().join(",")
    );
  }

  // Then add diverse schedules until we reach MAX_KEPT_VARIANTS
  for (
    let i = 1;
    i < scoredSchedules.length && selectedSchedules.length < MAX_KEPT_VARIANTS;
    i++
  ) {
    const courseCombination = [...scoredSchedules[i].includedCourses]
      .sort()
      .join(",");

    // Add if this is a new combination of courses
    if (!selectedCoursesCombinations.has(courseCombination)) {
      selectedSchedules.push(scoredSchedules[i].schedule);
      selectedCoursesCombinations.add(courseCombination);
    }
  }

  // If we still don't have enough, add more by score
  if (
    selectedSchedules.length <
    Math.min(MAX_KEPT_VARIANTS, scoredSchedules.length)
  ) {
    for (
      let i = 0;
      i < scoredSchedules.length &&
      selectedSchedules.length < MAX_KEPT_VARIANTS;
      i++
    ) {
      if (!selectedSchedules.includes(scoredSchedules[i].schedule)) {
        selectedSchedules.push(scoredSchedules[i].schedule);
      }
    }
  }

  console.log(
    `Keeping ${selectedSchedules.length} diverse schedules with different course combinations`
  );

  // Convert all found schedules to the required format
  const variants = selectedSchedules.map((schedule) => {
    return schedule.map((course) => ({
      classId: course.classId,
      title: course.title,
      count: course.count, // Make sure to include count
      capacity: course.capacity, // Make sure to include capacity
      type: course.schedule[0]?.type || "Unknown",
      day: course.schedule[0]?.day || "Unknown",
      timeStart: course.schedule[0]?.timeStart || "Unknown",
      timeEnd: course.schedule[0]?.timeEnd || "Unknown",
      room: course.schedule[0]?.room || "Unknown",
      schedule: course.schedule,
    }));
  });

  // Apply AI ranking to schedules - this is separate from our diversity algorithm
  const rankedVariants = variants.map((variant) => {
    const ranking = rankScheduleQuality(variant);
    return {
      variant,
      score: ranking.score,
      metrics: ranking.metrics,
    };
  });

  // Sort by score (highest first) for the final ordering
  rankedVariants.sort((a, b) => b.score - a.score);

  // Return sorted variants
  return rankedVariants.map((item) => item.variant);
};

// Generate a consistent color for a course across multiple schedules
const generateColor = (title: string) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-lime-500",
    "bg-fuchsia-500",
  ];

  // Hash the title to ensure the same course always gets the same base color
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash + title.charCodeAt(i) * (i + 1)) % colors.length;
  }

  // Get base color
  const baseColor = colors[hash];

  return baseColor;
};

// Update the schedule grid to show enrollment info more prominently
const createScheduleGrid = (
  validVariants: CourseInSchedule[][],
  selectedCourses: { [key: string]: Course[] }
) => {
  // Make sure we include all days Sunday through Thursday consistently
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return validVariants.map((variant, variantIdx) => {
    // Group courses by title to count unique courses
    const uniqueCourses = [...new Set(variant.map((course) => course.title))];

    // Create a color map for each unique course
    const courseColorMap: { [key: string]: { [type: string]: string } } = {};
    uniqueCourses.forEach((title) => {
      courseColorMap[title] = {
        Theory: generateColor(title),
        Lab: generateColor(title),
        default: generateColor(title),
      };
    });

    // Create day-based schedule view - more visual representation
    const scheduleByDay: Record<
      string,
      Array<{
        course: CourseInSchedule;
        start: number;
        end: number;
        displayTime: string;
        type: string;
        room: string;
      }>
    > = {};

    // Initialize all days (even empty ones) to ensure consistent display order
    daysOfWeek.forEach((day) => {
      scheduleByDay[day] = [];
    });

    // Organize courses by day for timeline display
    variant.forEach((course) => {
      course.schedule.forEach((slot) => {
        const start = timeToMinutes(slot.timeStart);
        const end = timeToMinutes(slot.timeEnd);

        scheduleByDay[slot.day].push({
          course,
          start,
          end,
          displayTime: `${slot.timeStart}-${slot.timeEnd}`,
          type: slot.type,
          room: slot.room,
        });
      });
    });

    // Sort each day's schedule by start time
    Object.keys(scheduleByDay).forEach((day) => {
      scheduleByDay[day].sort((a, b) => a.start - b.start);
    });

    // Calculate free time periods between classes
    const freeTimeByDay: Record<
      string,
      Array<{ start: string; end: string; duration: string }>
    > = {};

    daysOfWeek.forEach((day) => {
      freeTimeByDay[day] = [];
      const daySchedule = scheduleByDay[day];

      if (daySchedule.length > 1) {
        // Sort by start time to ensure proper gap calculation
        daySchedule.sort((a, b) => a.start - b.start);

        // Find gaps between consecutive classes
        for (let i = 0; i < daySchedule.length - 1; i++) {
          const currentEnd = daySchedule[i].end;
          const nextStart = daySchedule[i + 1].start;

          if (nextStart > currentEnd) {
            // Convert minutes back to time strings for display
            const gapStartHour = Math.floor(currentEnd / 60);
            const gapStartMin = currentEnd % 60;
            const gapEndHour = Math.floor(nextStart / 60);
            const gapEndMin = nextStart % 60;

            const startTime = `${gapStartHour % 12 || 12}:${String(
              gapStartMin
            ).padStart(2, "0")} ${gapStartHour < 12 ? "AM" : "PM"}`;
            const endTime = `${gapEndHour % 12 || 12}:${String(
              gapEndMin
            ).padStart(2, "0")} ${gapEndHour < 12 ? "AM" : "PM"}`;

            // Calculate duration in hours and minutes
            const gapMinutes = nextStart - currentEnd;
            const gapHours = Math.floor(gapMinutes / 60);
            const gapRemainingMins = gapMinutes % 60;

            let durationText = "";
            if (gapHours > 0) {
              durationText += `${gapHours}h `;
            }
            if (gapRemainingMins > 0 || gapHours === 0) {
              durationText += `${gapRemainingMins}m`;
            }

            freeTimeByDay[day].push({
              start: startTime,
              end: endTime,
              duration: durationText.trim(),
            });
          }
        }
      }
    });

    // Function to export the selected schedule to Word
    const exportScheduleToWord = async (
      scheduleData: CourseInSchedule[],
      variantIdx: number
    ) => {
      try {
        // Import the export function dynamically to reduce initial load time
        const { exportToWord } = await import("../utils/wordExport");

        // Generate the Word document
        const blob = await exportToWord(scheduleData, variantIdx);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Schedule_Option_${variantIdx + 1}.docx`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error exporting to Word:", error);
        alert("Failed to export schedule. Please try again later.");
      }
    };

    return (
      <div
        id={`schedule-${variantIdx}`}
        key={variantIdx}
        className="mb-10 p-4 sm:p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Schedule Option {variantIdx + 1} ({uniqueCourses.length}/
            {Object.keys(selectedCourses).length} courses)
          </h2>

          <button
            onClick={() => exportScheduleToWord(variant, variantIdx)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export
          </button>
        </div>

        {/* Better visual representation of the schedule by day */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-medium mb-3 text-center">
            Weekly Schedule:
          </h3>
          <div className="space-y-4">
            {/* Always show all days in order, even if empty */}
            {daysOfWeek.map((day) => {
              const daySchedule = scheduleByDay[day];
              const freeTimes = freeTimeByDay[day];

              // Show all days consistently, even empty ones
              return (
                <div key={day} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 sm:px-4 py-2 font-semibold border-b">
                    {day}
                  </div>
                  {daySchedule.length > 0 ? (
                    <div className="divide-y">
                      {daySchedule.map((item, idx) => {
                        const courseColor =
                          courseColorMap[item.course.title]?.[item.type] ||
                          courseColorMap[item.course.title]?.default;

                        // Get original course data to ensure we have count and capacity
                        const originalCourseData = selectedCourses[
                          item.course.title.split(" [")[0]
                        ]?.find((c) => c.classId === item.course.classId);

                        // Use the data from either the course in the variant or from the original data
                        const count =
                          item.course.count ||
                          originalCourseData?.count ||
                          "N/A";
                        const capacity =
                          item.course.capacity ||
                          originalCourseData?.capacity ||
                          "N/A";

                        // Calculate percentage if both values are available and numeric
                        let percentText = "";
                        let empty = "";
                        if (count !== "N/A" && capacity !== "N/A") {
                          try {
                            const countNum = parseInt(count.toString());
                            const capacityNum = parseInt(capacity.toString());
                            const fillPercentage = Math.round(
                              (countNum / capacityNum) * 100
                            );
                            percentText = ` (${fillPercentage}%)`;
                            empty = `(${capacityNum - countNum})`;
                          } catch (e) {
                            console.error("Error calculating percentage:", e);
                          }
                        }

                        return (
                          <div
                            key={idx}
                            className="px-3 sm:px-4 py-2 flex flex-col"
                          >
                            <div className="flex items-start">
                              <div className="w-16 sm:w-20 text-xs sm:text-sm text-gray-600 pt-1 pr-1">
                                {item.displayTime}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <span
                                    className={`min-w-3 min-h-3 max-w-3 max-h-3 rounded-full ${courseColor} mr-1 sm:mr-2 flex-shrink-0`}
                                  ></span>
                                  <span className="font-medium text-sm sm:text-base">
                                    {item.course.title}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.type} · Room: {item.room}
                                </div>

                                {/* Always display enrollment info with debug output */}
                                <div className="text-xs mt-1 flex flex-col border-t pt-1 border-gray-100">
                                  <div className="flex flex-wrap items-center">
                                    <span className="font-medium mr-1">
                                      Count:
                                    </span>
                                    <span>
                                      {count}
                                      {empty}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center">
                                    <span className="font-medium mr-1">
                                      Capacity:
                                    </span>

                                    <span>
                                      {capacity}
                                      {percentText}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 sm:px-4 py-3 text-sm text-gray-500 italic text-center">
                      No classes scheduled
                    </div>
                  )}

                  {/* Display free time periods - improved for mobile */}
                  {freeTimes.length > 0 && (
                    <div className="px-3 sm:px-4 py-2 bg-blue-50">
                      <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">
                        Free Time:
                      </p>
                      <div className="space-y-1">
                        {freeTimes.map((gap, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-blue-600 flex flex-wrap items-center"
                          >
                            <span className="mr-1">
                              {gap.start} - {gap.end}
                            </span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">
                              ({gap.duration})
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Show course tags at the bottom of the schedule with enhanced enrollment info */}
        <div className="mt-4 flex flex-wrap gap-1 sm:gap-2 justify-center">
          {uniqueCourses.map((course, idx) => {
            const courseColor =
              courseColorMap[course]?.default || "bg-gray-500";

            // Find the course object to get enrollment data
            const courseObj = variant.find((c) => c.title === course);
            const courseBaseTitle = course.split(" [")[0];
            const originalCourse = selectedCourses[courseBaseTitle]?.find(
              (c) => c.classId === courseObj?.classId
            );

            // Make sure we use the data correctly
            const count = courseObj?.count || originalCourse?.count || "N/A";
            const capacity =
              courseObj?.capacity || originalCourse?.capacity || "N/A";

            // Only show badge if we have actual data
            let enrollmentBadge = null;
            if (count !== "N/A" && capacity !== "N/A") {
              try {
                const countNum = parseInt(count.toString());
                const capacityNum = parseInt(capacity.toString());
                const fillPercentage = Math.round(
                  (countNum / capacityNum) * 100
                );

                // Create a more informative badge showing enrollment
                let badgeColor = "bg-green-700";
                let textColor = "text-green-50";
                if (fillPercentage >= 95) {
                  badgeColor = "bg-red-700";
                  textColor = "text-red-50";
                } else if (fillPercentage >= 80) {
                  badgeColor = "bg-yellow-700";
                  textColor = "text-yellow-50";
                }

                enrollmentBadge = (
                  <span
                    className={`${badgeColor} ${textColor} ml-1 px-2 py-0.5 rounded text-xs whitespace-nowrap`}
                  >
                    {count}/{capacity}
                  </span>
                );
              } catch (e) {
                console.error("Error processing enrollment data:", e);
              }
            }

            return (
              <span
                key={idx}
                className={`${courseColor} flex items-center justify-center text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium mb-1 max-w-[180px] sm:max-w-none`}
              >
                <span className="mr-1">{course}</span>
                {enrollmentBadge}
              </span>
            );
          })}
        </div>
      </div>
    );
  });
};

// Also update the conflict analysis component to use the same days
const CourseConflictAnalysis = ({
  conflictMatrix,
  showConflictAnalysis,
  setShowConflictAnalysis,
}: {
  conflictMatrix: { [key: string]: { [key: string]: string[] } };
  showConflictAnalysis: boolean;
  setShowConflictAnalysis: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const hasConflicts = Object.keys(conflictMatrix).some(
    (course) => Object.keys(conflictMatrix[course]).length > 0
  );

  // Count total conflicts
  const totalConflicts = Object.entries(conflictMatrix).reduce(
    (count, [, conflicts]) => count + Object.keys(conflicts).length,
    0
  );

  // Check if all courses have at least one conflict
  const allCoursesHaveConflicts = Object.keys(conflictMatrix).every(
    (course) => Object.keys(conflictMatrix[course]).length > 0
  );

  // Get list of courses with the most conflicts
  const coursesWithMostConflicts = Object.entries(conflictMatrix)
    .map(([course, conflicts]) => ({
      course,
      conflictCount: Object.keys(conflicts).length,
    }))
    .sort((a, b) => b.conflictCount - a.conflictCount)
    .slice(0, 3)
    .map((item) => item.course);

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowConflictAnalysis(!showConflictAnalysis)}
        className={`text-xs sm:text-sm font-medium flex items-center flex-wrap mb-2 ${
          hasConflicts
            ? "text-red-600 hover:text-red-800"
            : "text-blue-600 hover:text-blue-800"
        }`}
      >
        {showConflictAnalysis ? "Hide" : "Show"} Time Conflict Analysis
        {hasConflicts && (
          <span className="ml-2 py-1 px-2 bg-red-100 text-red-800 text-xs rounded-full">
            {allCoursesHaveConflicts
              ? "All Courses Conflict"
              : `${totalConflicts} Conflicts`}
          </span>
        )}
      </button>

      {showConflictAnalysis && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
          <h3 className="text-base sm:text-lg font-medium mb-3">
            Course Time Conflict Analysis
          </h3>

          {/* Add prominent explanation at the top with emphasis on all courses having conflicts */}
          <div
            className={`p-3 sm:p-4 rounded-lg mb-3 ${
              hasConflicts
                ? "bg-yellow-50 border border-yellow-300"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p className="mb-2 font-medium">
              {allCoursesHaveConflicts
                ? "⚠️ All selected courses have time conflicts with each other"
                : "How the scheduler handles time conflicts:"}
            </p>

            {allCoursesHaveConflicts && (
              <div className="mb-3 text-orange-700">
                <p>
                  Since every course conflicts with at least one other course,
                  the scheduler will generate multiple schedule options with
                  different combinations of courses.
                </p>
                <p className="mt-2">
                  Courses with the most conflicts:{" "}
                  {coursesWithMostConflicts.join(", ")}
                </p>
              </div>
            )}

            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Courses with time conflicts{" "}
                <strong>
                  cannot appear together in the same schedule option
                </strong>
              </li>
              <li>
                Each schedule option will include a different combination of
                non-conflicting courses
              </li>
              <li>
                For the best results, browse through all the schedule options to
                find one that includes your priority courses
              </li>
              <li>
                {allCoursesHaveConflicts
                  ? "You will need to choose which courses are more important, as they can't all be taken together"
                  : "The scheduler prioritizes including as many courses as possible"}
              </li>
            </ul>
          </div>

          {/* Rest of the conflict analysis display */}
          {/* ...existing code... */}
        </div>
      )}
    </div>
  );
};

// Refactor the component to use the new ConflictAnalysis component
const CourseScheduler = ({
  selectedCourses,
}: {
  selectedCourses: { [key: string]: Course[] };
}) => {
  const [validVariants, setValidVariants] = useState<CourseInSchedule[][]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scheduleCreated, setScheduleCreated] = useState(false);
  const [scheduledCourses, setScheduledCourses] = useState<{
    [key: string]: Course[];
  }>({});
  // Add cache for generated schedules
  const [scheduleCache, setScheduleCache] = useState<{
    [key: string]: CourseInSchedule[][];
  }>({});

  // Add state for AI selection and explanation
  const [aiSelectedIndex, setAiSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Add state to track conflicts between courses
  const [conflictMatrix, setConflictMatrix] = useState<{
    [key: string]: { [key: string]: string[] };
  }>({});
  const [showConflictAnalysis, setShowConflictAnalysis] = useState(false);

  // Use useMemo to prevent unnecessary recalculation of timeSlots
  const timeSlots = useMemo(
    () =>
      generateTimeSlots(
        Object.values(scheduledCourses).length > 0
          ? Object.values(scheduledCourses).flat()
          : Object.values(selectedCourses).flat()
      ),
    [selectedCourses, scheduledCourses, scheduleCreated]
  );

  // Use useCallback to memoize the handleCreateSchedule function
  const handleCreateSchedule = useCallback(() => {
    setLoading(true);
    setProgress(0);
    setScheduleCreated(true);
    setScheduledCourses(selectedCourses);

    // Generate a cache key based on selected courses
    const cacheKey = Object.keys(selectedCourses)
      .map(
        (title) =>
          `${title}-${selectedCourses[title].map((c) => c.classId).join(",")}`
      )
      .join("|");

    // Check if we have this calculation cached
    if (scheduleCache[cacheKey]) {
      setValidVariants(scheduleCache[cacheKey]);
      setLoading(false);
      setProgress(100);
      return;
    }

    // Use requestAnimationFrame to not block the UI
    requestAnimationFrame(() => {
      try {
        setProgress(30);

        // Calculate valid combinations - just get one good option
        const validCombinations = getValidCourseVariants(selectedCourses);

        setProgress(90);

        // Save to cache
        setScheduleCache((prev) => ({
          ...prev,
          [cacheKey]: validCombinations,
        }));

        // Update state with all results at once
        setValidVariants(validCombinations);
        setLoading(false);
        setProgress(100);
      } catch (error) {
        console.error("Error creating schedule:", error);
        setLoading(false);
        setProgress(0);
      }
    });
  }, [selectedCourses, scheduleCache]);

  // Memoize the button disable condition
  const isButtonDisabled = useMemo(
    () => loading || Object.keys(selectedCourses).length === 0,
    [loading, selectedCourses]
  );

  // Update button text based on state
  const buttonText = useMemo(() => {
    if (loading) return "Creating Schedule...";
    if (
      scheduleCreated &&
      JSON.stringify(Object.keys(selectedCourses).sort()) !==
        JSON.stringify(Object.keys(scheduledCourses).sort())
    ) {
      return "Update Schedule";
    }
    return "Create Schedule";
  }, [loading, scheduleCreated, selectedCourses, scheduledCourses]);

  // Memoize the grid display to prevent unnecessary re-renders
  const scheduleGrid = useMemo(() => {
    if (validVariants.length === 0 || !scheduleCreated) return null;
    return createScheduleGrid(validVariants, scheduledCourses);
  }, [validVariants, scheduledCourses, timeSlots, scheduleCreated]);

  // Clear schedule when selected courses change significantly
  useEffect(() => {
    if (
      scheduleCreated &&
      Object.keys(selectedCourses).length !==
        Object.keys(scheduledCourses).length
    ) {
      setScheduleCreated(false);
    }
  }, [selectedCourses, scheduledCourses]);

  // Calculate AI suggestion when variants change
  useEffect(() => {
    if (validVariants.length > 0) {
      // Find the best schedule according to our ranking algorithm
      let bestIndex = 0;
      let bestScore = -Infinity;

      validVariants.forEach((variant, index) => {
        const ranking = rankScheduleQuality(variant); // Pass the total courses count
        if (ranking.score > bestScore) {
          bestScore = ranking.score;
          bestIndex = index;
        }
      });

      setAiSelectedIndex(bestIndex);
    } else {
      setAiSelectedIndex(null);
    }
  }, [validVariants, selectedCourses]);

  // Get explanation for AI's choice
  const aiExplanation = useMemo(() => {
    if (aiSelectedIndex === null || validVariants.length === 0) {
      return null;
    }

    const selectedVariant = validVariants[aiSelectedIndex];
    const ranking = rankScheduleQuality(selectedVariant); // Pass the total courses

    // Create explanation text
    const explanation = [];

    // Course coverage
    const coursePercent = Math.round(
      (ranking.metrics.courseCount / Object.keys(selectedCourses).length) * 100
    );
    explanation.push(
      `✅ Includes ${ranking.metrics.courseCount} courses (${coursePercent}% of your selection)`
    );

    // Enrollment optimization
    const coursesWithEnrollmentInfo = selectedVariant.filter(
      (c) => c.count && c.capacity
    );
    if (coursesWithEnrollmentInfo.length > 0) {
      // Find sections with good availability
      const availableSections = coursesWithEnrollmentInfo.filter((course) => {
        const count = parseInt(course.count ?? "0");
        const capacity = parseInt(course.capacity ?? "1");
        return count / capacity < 0.9; // Less than 90% full
      });

      if (availableSections.length > 0) {
        explanation.push(
          `✅ Includes ${availableSections.length} sections with good seat availability`
        );
      }

      // Find almost full sections
      const almostFullSections = coursesWithEnrollmentInfo.filter((course) => {
        const count = parseInt(course.count ?? "0");
        const capacity = parseInt(course.capacity ?? "1");
        const fillPercent = count / capacity;
        return fillPercent >= 0.95;
      });

      if (almostFullSections.length > 0) {
        explanation.push(
          `⚠️ Includes ${almostFullSections.length} nearly full sections with limited seats`
        );
      }
    }

    // Gap analysis
    if (ranking.metrics.gapScore > 85) {
      explanation.push("✅ Minimal gaps between classes");
    } else if (ranking.metrics.gapScore > 70) {
      explanation.push("✅ Reasonable gaps between classes");
    } else {
      explanation.push("⚠️ Some classes have longer gaps");
    }

    // Mix pattern
    if (ranking.metrics.mixPattern > 15) {
      explanation.push(
        "✅ Excellent mix of theory and lab classes throughout the week"
      );
    } else if (ranking.metrics.mixPattern > 8) {
      explanation.push("✅ Good balance of different class types");
    } else if (ranking.metrics.mixPattern > 0) {
      explanation.push("⚠️ Some variety in class types, but could be better");
    } else {
      explanation.push("⚠️ Theory and lab classes are not mixed optimally");
    }

    // Compactness
    if (ranking.metrics.compactness > 80) {
      explanation.push("✅ Very efficient schedule with minimal waiting time");
    } else if (ranking.metrics.compactness > 60) {
      explanation.push("✅ Good balance of class time vs. waiting time");
    } else {
      explanation.push("⚠️ Schedule has some waiting periods between classes");
    }

    // Day balance
    if (ranking.metrics.balancedDays > 50) {
      explanation.push("✅ Well-balanced classes across days");
    } else {
      explanation.push("⚠️ Classes are concentrated on fewer days");
    }

    // Early classes
    if (ranking.metrics.earlyClasses === 0) {
      explanation.push("✅ No early morning classes");
    } else {
      explanation.push(
        `⚠️ Has ${ranking.metrics.earlyClasses} early morning classes`
      );
    }

    return explanation;
  }, [aiSelectedIndex, validVariants, selectedCourses]);

  // Analyze course conflicts when courses change
  useEffect(() => {
    if (Object.keys(selectedCourses).length > 0) {
      const conflicts: { [key: string]: { [key: string]: string[] } } = {};

      // Check each course against every other course
      const courseTitles = Object.keys(selectedCourses);

      for (let i = 0; i < courseTitles.length; i++) {
        const course1Title = courseTitles[i];
        conflicts[course1Title] = conflicts[course1Title] || {};

        for (let j = i + 1; j < courseTitles.length; j++) {
          const course2Title = courseTitles[j];

          // Check all section combinations
          const conflictReasons: string[] = [];

          for (const section1 of selectedCourses[course1Title]) {
            for (const section2 of selectedCourses[course2Title]) {
              const result = checkConflictWithReason(
                section1.schedule,
                section2.schedule
              );
              if (result.hasConflict && result.reason) {
                conflictReasons.push(
                  `${section1.classId} & ${section2.classId}: ${result.reason}`
                );
              }
            }
          }

          if (conflictReasons.length > 0) {
            conflicts[course1Title][course2Title] = conflictReasons;
            conflicts[course2Title] = conflicts[course2Title] || {};
            conflicts[course2Title][course1Title] = conflictReasons;
          }
        }
      }

      setConflictMatrix(conflicts);
    }
  }, [selectedCourses]);

  return (
    <div className=" py-4 sm:py-6 text-black">
      {/* Create Schedule Button */}
      <button
        onClick={handleCreateSchedule}
        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4 sm:mb-6 mx-auto block shadow-md transition duration-300 transform hover:scale-105"
        disabled={isButtonDisabled}
      >
        {buttonText}
      </button>
      <h1 className="text-2xl sm:text-3xl font-semibold text-center mb-4 sm:mb-6">
        Course Schedules
      </h1>

      {/* Progress bar */}
      {loading && (
        <div className="w-full bg-gray-300 h-2 mb-4 sm:mb-6">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Display message if no valid variants found */}
      {validVariants.length === 0 && !loading && scheduleCreated && (
        <p className="text-center text-lg sm:text-xl text-red-500">
          No valid course combinations found.
        </p>
      )}

      {/* Display count of schedule options */}
      {validVariants.length > 0 && !loading && (
        <p className="text-center mb-4">
          Found {validVariants.length} possible schedule combinations (out of
          max 20)
        </p>
      )}

      {/* Show course summary when selected */}
      {Object.keys(selectedCourses).length > 0 && (
        <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
            Selected Courses:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {Object.keys(selectedCourses).map((courseTitle) => (
              <div
                key={courseTitle}
                className="border rounded-md p-2 sm:p-3 bg-gray-50"
              >
                <h3 className="font-medium text-sm sm:text-base ">
                  {courseTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {selectedCourses[courseTitle].length} sections available
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display error message if data format is invalid */}
      {Object.keys(selectedCourses).length > 0 &&
        !Object.values(selectedCourses).some(
          (course) => Array.isArray(course) && course.length > 0
        ) && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6">
            <p className="font-semibold">Invalid course data format.</p>
            <p>
              Please ensure courses are provided in the correct format. Each
              course should have sections with schedule information.
            </p>
          </div>
        )}

      {/* Display AI recommendation if we have variants */}
      {validVariants.length > 0 && !loading && aiSelectedIndex !== null && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg shadow-md border border-blue-200">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800">
              <span className="mr-2">👌</span>
              Recommended
            </h2>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showExplanation ? "Hide explanation" : "Why this schedule?"}
            </button>
          </div>

          {showExplanation && aiExplanation && (
            <div className="mt-3 bg-white p-3 rounded-md text-sm">
              <p className="font-medium mb-2">
                This schedule was selected because:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {aiExplanation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex">
            <a
              href={`#schedule-${aiSelectedIndex}`}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded shadow-md transition duration-300 transform hover:scale-105 text-sm sm:text-base w-full text-center sm:w-auto"
            >
              Jump to recommended schedule
            </a>
          </div>
        </div>
      )}

      {/* Course Conflict Analysis */}
      {Object.keys(conflictMatrix).length > 0 && (
        <CourseConflictAnalysis
          conflictMatrix={conflictMatrix}
          showConflictAnalysis={showConflictAnalysis}
          setShowConflictAnalysis={setShowConflictAnalysis}
        />
      )}

      {/* Display the schedule variants */}
      {scheduleGrid}
    </div>
  );
};

export default CourseScheduler;
