import { useContext, useEffect, useState } from "react";
import {
  Link as RouterLink,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { UserContext } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export default function CoursesPage({ enrolledOnly = false }) {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);

  const search = searchParams.get("q")?.trim() || "";

  const parameters = new URLSearchParams({ q: search });

  if (enrolledOnly) {
    parameters.set("enrolled", "true");
  }

  const queryString = parameters.toString();
  const requestKey = `${user.id}:${queryString}`;

  const loading = result?.key !== requestKey;
  const courses = loading ? [] : result.courses;
  const error = loading ? "" : result.error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        if (!API_URL) {
          throw new Error("VITE_API_URL is not configured");
        }

        const response = await fetch(
          `${API_URL}/api/course?${queryString}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load courses");
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            courses: data.courses,
            error: "",
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            courses: [],
            error: err.message,
          });
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [queryString, requestKey]);

  function handleSearch(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const query = String(form.get("q") || "").trim();

    setSearchParams(query ? { q: query } : {});
  }

  const title = enrolledOnly
    ? "My Enrolled Courses"
    : user.role === "Teacher"
      ? "My Teaching Courses"
      : "Browse Courses";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/"
          sx={{ alignSelf: "flex-start" }}
        >
          Back to home
        </Button>

        <Typography variant="h4" component="h1">
          {title}
        </Typography>

        {location.state?.message && (
          <Alert severity="success">{location.state.message}</Alert>
        )}

        {user.role === "Teacher" && (
          <Button
            component={RouterLink}
            to="/courses/new"
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            Create Course
          </Button>
        )}

        <Box component="form" onSubmit={handleSearch}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              key={search}
              name="q"
              label="Course or Teacher name"
              defaultValue={search}
              fullWidth
            />

            <Button type="submit" variant="contained">
              Search
            </Button>
          </Stack>
        </Box>

        {loading && (
          <Typography role="status">Loading courses...</Typography>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && courses.length === 0 && (
          <Alert severity="info">No courses found.</Alert>
        )}

        {courses.map((course) => (
          <Paper key={course._id} sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="h6" component="h2">
                {course.name}
              </Typography>

              <Chip
                label={course.status}
                size="small"
                sx={{ alignSelf: "flex-start" }}
              />

              <Typography>
                Teacher: {course.teacherName}
              </Typography>

              <Typography>
                Duration: {course.durationDays} days
              </Typography>

              <Typography>
                Topics: {course.topics.join(", ")}
              </Typography>

              <Typography>
                Price: {course.price.toLocaleString()}
              </Typography>

              <Typography>
                Enrolled: {course.enrolledCount} / {course.maxStudents}
                {" · "}
                Available seats: {course.availableSeats}
              </Typography>

              <Button
                component={RouterLink}
                to={`/courses/${course._id}`}
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
              >
                View Details
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
