
  // Define the CourseInSchedule interface
interface CourseInSchedule {
    classId: string;
    title: string;
    type: string;
    day: string;
    timeStart: string;
    timeEnd: string;
    room: string;
    schedule: TimeSchedule[];
    count?: string ;
    capacity?: string;
  }