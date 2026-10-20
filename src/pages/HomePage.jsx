import { useContext, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { UserContext } from "../context/UserContext";

export default function HomePage() {
  const { user, error, logout } = useContext(UserContext);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);

    try {
      await logout();
    } catch {
      // The user context exposes the error displayed below.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <Typography variant="h4" component="h1">
            Welcome, {user.username}
          </Typography>

          <Typography>{user.email}</Typography>
          <Typography>Role: {user.role}</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            component={RouterLink}
            to="/courses"
            variant="contained"
          >
            {user.role === "Teacher" ? "My Teaching Courses" : "Browse Courses"}
          </Button>

          {user.role === "Student" && (
            <Button
              component={RouterLink}
              to="/my-courses"
              variant="outlined"
            >
              My Enrolled Courses
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={handleLogout}
            disabled={submitting}
          >
            {submitting ? "Signing out..." : "Sign out"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
