import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { UserContext } from "../context/UserContext";

export default function LoginPage() {
  const { user, loading, error, login } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(email, password);
    } catch {
      // The user context exposes the error displayed below.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p role="status">Checking session...</p>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" component="h1">
          Online Course Service
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Sign in to continue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              required
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              required
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}