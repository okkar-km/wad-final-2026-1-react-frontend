//src/App.jsx

import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { CssBaseline } from "@mui/material";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import CourseFormPage from "./pages/CourseFormPage";

export default function App() {
  return (
    <HashRouter>
      <CssBaseline />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route
            path="/courses/:courseId"
            element={<CourseDetailsPage />}
          />
          <Route
            path="/my-courses"
            element={<CoursesPage enrolledOnly />}
          />
        </Route>

        <Route element={<ProtectedRoute roles={["Teacher"]} />}>
          <Route path="/courses/new" element={<CourseFormPage />} />
          <Route path="/courses/:courseId/edit" element={<CourseFormPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
