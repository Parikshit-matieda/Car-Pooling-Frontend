import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import RideCreationFlow from './pages/RideCreationFlow';
import UploadLicense from './pages/UploadLicense';
import SearchRides from './pages/SearchRides';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import MyRides from './pages/MyRides';

// Footer Pages
import About from './pages/footer-pages/About';
import PrivacyPolicy from './pages/footer-pages/PrivacyPolicy';
import TermsOfUse from './pages/footer-pages/TermsOfUse';
import Careers from './pages/footer-pages/Careers';
import HelpCentre from './pages/footer-pages/HelpCentre';
import SafetyGuides from './pages/footer-pages/SafetyGuides';
import ContactUs from './pages/footer-pages/ContactUs';
import DailyOfficeCommute from './pages/footer-pages/DailyOfficeCommute';
import IntercityTravels from './pages/footer-pages/IntercityTravels';
import AirportShuttles from './pages/footer-pages/AirportShuttles';
import VerifiedDrivers from './pages/footer-pages/VerifiedDrivers';

// Dashboard router that redirects based on role
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <UserDashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchRides />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Protected user routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-ride"
            element={
              <ProtectedRoute>
                <RideCreationFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-license"
            element={
              <ProtectedRoute>
                <UploadLicense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-rides"
            element={
              <ProtectedRoute>
                <MyRides />
              </ProtectedRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Footer Information Routes */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/help-centre" element={<HelpCentre />} />
          <Route path="/safety-guides" element={<SafetyGuides />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/services/daily-commute" element={<DailyOfficeCommute />} />
          <Route path="/services/intercity" element={<IntercityTravels />} />
          <Route path="/services/airport-shuttles" element={<AirportShuttles />} />
          <Route path="/services/verified-drivers" element={<VerifiedDrivers />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
