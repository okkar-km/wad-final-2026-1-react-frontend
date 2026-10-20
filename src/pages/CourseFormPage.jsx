import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export default function CourseFormPage() {
  const { courseId } = useParams();

  return <CourseEditor key={courseId || "new"} courseId={courseId} />;
}

function CourseEditor({ courseId }) {
  const [result, setResult] = useState(null);
  const cancelPath = courseId ? `/courses/${courseId}` : "/courses";

  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    async function loadCourse() {
      try {
        if (!API_URL) throw new Error("VITE_API_URL is not configured");

        const response = await fetch(
          `${API_URL}/api/course/${encodeURIComponent(courseId)}`,
          { credentials: "include", signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load course");
        }

        if (!controller.signal.aborted) {
          setResult({ course: data.course, error: "" });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({ course: null, error: err.message });
        }
      }
    }

    loadCourse();
    return () => controller.abort();
  }, [courseId]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to={cancelPath}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to {courseId ? "course details" : "courses"}
        </Button>

        <Typography variant="h4" component="h1">
          {courseId ? "Edit Course" : "Create Course"}
        </Typography>

        {courseId && !result && (
          <Typography role="status">Loading course...</Typography>
        )}

        {result?.error && <Alert severity="error">{result.error}</Alert>}

        {(!courseId || result?.course) && (
          <CourseForm courseId={courseId} course={result?.course} />
        )}
      </Stack>
    </Container>
  );
}

function CourseForm({ courseId, course }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState(() => ({
    name: course?.name ?? "",
    durationDays: String(course?.durationDays ?? ""),
    topicsText: course?.topics.join("\n") ?? "",
    price: String(course?.price ?? 0),
    maxStudents: String(course?.maxStudents ?? ""),
    status: course?.status ?? "Open",
  }));

  const minCapacity = Math.max(1, course?.enrolledCount ?? 0);
  const cancelPath = courseId ? `/courses/${courseId}` : "/courses";

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      if (!API_URL) throw new Error("VITE_API_URL is not configured");

      const payload = {
        name: values.name.trim(),
        durationDays: Number(values.durationDays),
        topics: values.topicsText
          .split("\n")
          .map((topic) => topic.trim())
          .filter(Boolean),
        price: Number(values.price),
        maxStudents: Number(values.maxStudents),
        status: values.status,
      };

      if (!payload.name) throw new Error("Course name is required");
      if (!Number.isSafeInteger(payload.durationDays) || payload.durationDays < 1) {
        throw new Error("Duration must be a positive integer");
      }
      if (!payload.topics.length) {
        throw new Error("Provide at least one topic");
      }
      if (!values.price.trim() || !Number.isFinite(payload.price) || payload.price < 0) {
        throw new Error("Price must be a non-negative number");
      }
      if (!Number.isSafeInteger(payload.maxStudents) || payload.maxStudents < minCapacity) {
        throw new Error(`Maximum Students must be an integer of at least ${minCapacity}`);
      }
      if (!["Open", "Close", "Cancel"].includes(payload.status)) {
        throw new Error("Select a valid status");
      }

      const endpoint = courseId
        ? `${API_URL}/api/course/${encodeURIComponent(courseId)}`
        : `${API_URL}/api/course`;

      const response = await fetch(endpoint, {
        method: courseId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save course");
      }

      const savedId = courseId || data.course._id;
      navigate(`/courses/${savedId}`, {
        replace: true,
        state: {
          message: courseId
            ? "Course updated successfully"
            : "Course created successfully",
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            name="name"
            label="Course name"
            value={values.name}
            onChange={handleChange}
            disabled={saving}
            required
            fullWidth
          />
          <TextField
            name="durationDays"
            label="Duration (days)"
            type="number"
            value={values.durationDays}
            onChange={handleChange}
            slotProps={{ htmlInput: { min: 1, max: Number.MAX_SAFE_INTEGER, step: 1 } }}
            disabled={saving}
            required
            fullWidth
          />
          <TextField
            name="topicsText"
            label="Topics"
            helperText="Enter one topic per line"
            value={values.topicsText}
            onChange={handleChange}
            multiline
            minRows={3}
            disabled={saving}
            required
            fullWidth
          />
          <TextField
            name="price"
            label="Price"
            type="number"
            value={values.price}
            onChange={handleChange}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            disabled={saving}
            required
            fullWidth
          />
          <TextField
            name="maxStudents"
            label="Maximum Students"
            type="number"
            value={values.maxStudents}
            onChange={handleChange}
            helperText={course ? `${course.enrolledCount} Students currently enrolled` : ""}
            slotProps={{ htmlInput: { min: minCapacity, max: Number.MAX_SAFE_INTEGER, step: 1 } }}
            disabled={saving}
            required
            fullWidth
          />
          <TextField
            name="status"
            label="Status"
            value={values.status}
            onChange={handleChange}
            select
            disabled={saving}
            required
            fullWidth
          >
            {["Open", "Close", "Cancel"].map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : courseId ? "Save Changes" : "Create Course"}
            </Button>
            <Button component={RouterLink} to={cancelPath} disabled={saving}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
