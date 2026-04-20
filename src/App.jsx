import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewPatient from "./pages/NewPatient";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import NewSession from "./pages/NewSession";
import Calendar from "./pages/Calendar";
import ScheduleSession from "./pages/ScheduleSession";
import SessionHistory from "./pages/SessionHistory";
import Signature from "./pages/Signature";
import SessionReport from './pages/SessionReport';


const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <PrivateRoute>
            <Patients />
          </PrivateRoute>
        }
      />
      <Route
        path="/patients/new"
        element={
          <PrivateRoute>
            <NewPatient />
          </PrivateRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <PrivateRoute>
            <PatientDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/sessions/new"
        element={
          <PrivateRoute>
            <NewSession />
          </PrivateRoute>
        }
      />
      <Route
        path="/sessions/schedule"
        element={
          <PrivateRoute>
            <ScheduleSession />
          </PrivateRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <PrivateRoute>
            <Calendar />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/patients/:id/sessions"
        element={
          <PrivateRoute>
            <SessionHistory />
          </PrivateRoute>
        }
      />

      <Route
        path="/sessions/:id/sign"
        element={
          <PrivateRoute>
            <Signature />
          </PrivateRoute>
        }
      />

      <Route path="/relatorio" element={<PrivateRoute> <SessionReport /></PrivateRoute>}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
