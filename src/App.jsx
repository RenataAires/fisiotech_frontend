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
import PendingPayments from './pages/PendingPayments';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      
      {/* --- Rotas de Pacientes --- */}
      <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
      <Route path="/patients/new" element={<PrivateRoute><NewPatient /></PrivateRoute>} />
      <Route path="/patients/:id" element={<PrivateRoute><PatientDetail /></PrivateRoute>} />
      <Route path="/patients/:id/sessions" element={<PrivateRoute><SessionHistory /></PrivateRoute>} />

      {/* --- Rotas de Sessões --- */}
      <Route path="/sessions/new" element={<PrivateRoute><NewSession /></PrivateRoute>} />
      <Route path="/sessions/schedule" element={<PrivateRoute><ScheduleSession /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      
      {/* 🚀 Rotas Específicas de Sessão (Devem estar antes do *) */}
      <Route path="/sessions/:id/sign" element={<PrivateRoute><Signature /></PrivateRoute>} />
      <Route path="/sessions/:id/report" element={<PrivateRoute><SessionReport /></PrivateRoute>} />
      <Route 
        path="/sessions/:id/edit" 
        element={<PrivateRoute><NewSession /></PrivateRoute>} 
      />

      <Route path="/payments/pending" element={<PrivateRoute><PendingPayments /></PrivateRoute>} />

      {/* 🛑 ROTA CORINGA: SEMPRE POR ÚLTIMO */}
      <Route path="*" element={<Navigate to="/" replace />} />
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