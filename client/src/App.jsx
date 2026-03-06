import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DailyDosePage from './pages/patient/DailyDosePage';
import InsightsPage from './pages/patient/InsightsPage';
import RewardsPage from './pages/patient/RewardsPage';
import PillVerificationPage from './pages/patient/PillVerificationPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import ClinicianDashboardPage from './pages/clinician/ClinicianDashboardPage';
import PatientRosterPage from './pages/clinician/PatientRosterPage';
import RefillRequestsPage from './pages/clinician/RefillRequestsPage';
import EscalationsPage from './pages/clinician/EscalationsPage';
import AnalyticsPage from './pages/clinician/AnalyticsPage';
import ReportsPage from './pages/clinician/ReportsPage';
import ConflictCenterPage from './pages/pharmacist/ConflictCenterPage';
import PharmacistDashboardPage from './pages/pharmacist/PharmacistDashboardPage';
import PatientRecordsPage from './pages/pharmacist/PatientRecordsPage';
import MedicationLogsPage from './pages/pharmacist/MedicationLogsPage';
import PharmacistSettingsPage from './pages/pharmacist/PharmacistSettingsPage';
import PendingDispensesPage from './pages/pharmacist/PendingDispensesPage';
import CaregiverDashboardPage from './pages/caregiver/CaregiverDashboardPage';
import CaregiverPatientsPage from './pages/caregiver/CaregiverPatientsPage';
import CaregiverAlertsPage from './pages/caregiver/CaregiverAlertsPage';
import CaregiverSettingsPage from './pages/caregiver/CaregiverSettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated, getDefaultRoute } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />}
      />

      {/* Patient Routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/patient/schedule" element={<DailyDosePage />} />
        <Route path="/patient/insights" element={<InsightsPage />} />
        <Route path="/patient/rewards" element={<RewardsPage />} />
        <Route path="/patient/verify" element={<PillVerificationPage />} />
        <Route path="/patient/profile" element={<PatientProfilePage />} />
      </Route>

      {/* Clinician Routes */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/clinician/dashboard" element={<ClinicianDashboardPage />} />
        <Route path="/clinician/roster" element={<PatientRosterPage />} />
        <Route path="/clinician/refills" element={<RefillRequestsPage />} />
        <Route path="/clinician/escalations" element={<EscalationsPage />} />
        <Route path="/clinician/analytics" element={<AnalyticsPage />} />
        <Route path="/clinician/reports" element={<ReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['pharmacist']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/pharmacist/dashboard" element={<PharmacistDashboardPage />} />
        <Route path="/pharmacist/records" element={<PatientRecordsPage />} />
        <Route path="/pharmacist/conflicts" element={<ConflictCenterPage />} />
        <Route path="/pharmacist/logs" element={<MedicationLogsPage />} />
        <Route path="/pharmacist/pending" element={<PendingDispensesPage />} />
        <Route path="/pharmacist/settings" element={<PharmacistSettingsPage />} />
      </Route>

      {/* Caregiver Routes */}
      <Route element={<ProtectedRoute allowedRoles={['caregiver']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/caregiver/dashboard" element={<CaregiverDashboardPage />} />
        <Route path="/caregiver/patients" element={<CaregiverPatientsPage />} />
        <Route path="/caregiver/alerts" element={<CaregiverAlertsPage />} />
        <Route path="/caregiver/settings" element={<CaregiverSettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
