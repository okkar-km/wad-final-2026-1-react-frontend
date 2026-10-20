import { useContext, useEffect, useState } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { UserContext } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const location = useLocation();

  // Reset local state when navigating to a different course.
  return (
    <CourseDetails
      key={courseId}
      courseId={courseId}
      notice={location.state?.message}
    />
  );
}

function CourseDetails({ courseId, notice }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [action, setAction] = useState({
    pending: false,
    error: "",
    message: "",
  });

  const requestKey = `${user.id}:${courseId}:${refresh}`;
  const loading = result?.key !== requestKey;
  const course = loading ? null : result.course;
  const loadError = loading ? "" : result.error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      try {
        if (!API_URL) {
          throw new Error("VITE_API_URL is not configured");
        }

        const response = await fetch(
          `${API_URL}/api/course/${encodeURIComponent(courseId)}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load course");
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            course: data.course,
            error: "",
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            course: null,
            error: err.message,
          });
        }
      }
    }

    loadCourse();

    return () => controller.abort();
  }, [courseId, requestKey]);

  async function handleEnroll() {
    setAction({ pending: true, error: "", message: "" });

    try {
      const response = await fetch(
        `${API_URL}/api/course/${encodeURIComponent(courseId)}/enroll`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to enroll");
      }

      setAction({
        pending: false,
        error: "",
        message: data.message || "Enrolled successfully",
      });
    } catch (err) {
      setAction({
        pending: false,
        error: err.message,
        message: "",
      });
    } finally {
      // Refresh even after rejection: seats or status may have changed.
      setRefresh((value) => value + 1);
    }
  }

  async function handleDelete() {
    setDeleteOpen(false);
    setAction({ pending: true, error: "", message: "" });

    try {
      const response = await fetch(
        `${API_URL}/api/course/${encodeURIComponent(courseId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete course");
      }

      navigate("/courses", {
        replace: true,
        state: { message: data.message || "Course deleted successfully" },
      });
    } catch (err) {
      setAction({ pending: false, error: err.message, message: "" });
      setRefresh((value) => value + 1);
    }
  }

  const enrollLabel = action.pending
    ? "Enrolling..."
    : course?.isEnrolled
      ? "Already enrolled"
      : course?.status !== "Open"
        ? "Enrollment closed"
        : course?.availableSeats === 0
          ? "Course full"
          : "Enroll";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/courses"
          sx={{ alignSelf: "flex-start" }}
        >
          Back to courses
        </Button>

        <Typography variant="h4" component="h1">
          Course Details
        </Typography>

        {notice && !action.pending && !action.error && !action.message && (
          <Alert severity="success">{notice}</Alert>
        )}

        {loading && (
          <Typography role="status">Loading course...</Typography>
        )}

        {loadError && <Alert severity="error">{loadError}</Alert>}
        {action.error && (
          <Alert severity="error">{action.error}</Alert>
        )}
        {action.message && (
          <Alert severity="success">{action.message}</Alert>
        )}

        {course && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5" component="h2">
                {course.name}
              </Typography>

              <Chip
                label={course.status}
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
              </Typography>
              <Typography>
                Available seats: {course.availableSeats}
              </Typography>

              {user.role === "Student" && (
                <Button
                  variant="contained"
                  onClick={handleEnroll}
                  disabled={action.pending || !course.canEnroll}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {enrollLabel}
                </Button>
              )}

              {user.role === "Teacher" && (
                <>
                  <Stack direction="row" spacing={2}>
                    <Button
                      component={RouterLink}
                      to={`/courses/${courseId}/edit`}
                      variant="outlined"
                      disabled={action.pending}
                    >
                      Edit Course
                    </Button>
                    <Button
                      color="error"
                      variant="outlined"
                      disabled={action.pending || course.enrolledCount > 0}
                      onClick={() => setDeleteOpen(true)}
                    >
                      {action.pending ? "Deleting..." : "Delete Course"}
                    </Button>
                  </Stack>

                  {course.enrolledCount > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Courses with enrolled Students cannot be deleted.
                    </Typography>
                  )}

                  <Typography variant="h6" component="h3">
                    Enrolled Students
                  </Typography>

                  {course.enrolledStudents?.length ? (
                    course.enrolledStudents.map((student) => (
                      <Paper
                        key={student.id}
                        variant="outlined"
                        sx={{ p: 2 }}
                      >
                        <Typography>{student.username}</Typography>
                        <Typography color="text.secondary">
                          {student.email}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography>No Students enrolled yet.</Typography>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          aria-labelledby="delete-course-title"
        >
          <DialogTitle id="delete-course-title">Delete course?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Delete "{course?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={action.pending || !course || course.enrolledCount > 0}
            >
              Delete Course
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
