// Define the CourseInSchedule interface
/* eslint-disable @typescript-eslint/no-unused-vars */
interface CourseInSchedule {
  classId: string;
  title: string;
  type: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  schedule: TimeSchedule[];
  count?: string;
  capacity?: string;
}
