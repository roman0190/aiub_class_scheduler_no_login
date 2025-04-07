import * as React from "react";
import MuiAutocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Box, Typography, Paper, useMediaQuery, useTheme } from "@mui/material";
import CourseScheduler from "./CourseScheduler";

interface AutocompleteProps {
  courses: Course[];
}

const Autocomplete: React.FC<AutocompleteProps> = ({ courses }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Filter only "Open" status courses
  const openCourses = React.useMemo(
    () => courses.filter((course) => course.status === "Open"),
    [courses]
  );

  // Extract unique course titles without sections
  const uniqueCourseTitles = React.useMemo(
    () =>
      Array.from(
        new Set(
          openCourses.map((course) =>
            course.title.replace(/\s*\[([A-Z0-9]+)\]$/, "")
          )
        )
      ),
    [openCourses]
  );

  // State to store selected courses with all their sections
  const [selectedCourses, setSelectedCourses] = React.useState<{
    [key: string]: Course[];
  }>({});


  const handleChange = (_: React.SyntheticEvent, selectedTitles: string[]) => {
    const newSelectedCourses: { [key: string]: Course[] } = {};

    selectedTitles.forEach((title) => {
      newSelectedCourses[title] = openCourses.filter(
        (course) => course.title.replace(/\s*\[([A-Z0-9]+)\]$/, "") === title
      );
    });

    setSelectedCourses(newSelectedCourses);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: 1, sm: 3 },
        borderRadius: { xs: 1, sm: 2 },
        backgroundColor: "transparent",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{
          mb: { xs: 1, sm: 2 },
          fontWeight: 600,
          fontSize: { xs: "0.95rem", sm: "1.25rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        Course Selection
      </Typography>

      <Box
        sx={{
          width: "100%",
          mb: { xs: 2, sm: 4 },
          mx: "auto",
        }}
      >
        <MuiAutocomplete
          multiple
          id="course-autocomplete"
          options={uniqueCourseTitles}
          onChange={handleChange}
          fullWidth
          disablePortal={isMobile}
          ListboxProps={{
            style: {
              maxHeight: isMobile ? "40vh" : "50vh",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Courses"
              placeholder={isMobile ? "Search courses" : "Type a course name"}
              fullWidth
              variant="outlined"
            />
          )}
        />
      </Box>

      <Box sx={{ width: "100%" }}>
        <CourseScheduler selectedCourses={selectedCourses} />
      </Box>
    </Paper>
  );
};

export default Autocomplete;
