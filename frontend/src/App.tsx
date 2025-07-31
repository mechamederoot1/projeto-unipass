import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Homepage from './pages/Homepage';
import CheckInPage from './pages/CheckInPage';
import UserProfile from './pages/UserProfile';
import GymProfile from './pages/GymProfile';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Gamification from './pages/Gamification';
import GymDashboard from './pages/GymDashboard';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import InstallPrompt from './components/InstallPrompt';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen-safe bg-gray-50">
            <Navbar />
            <main className="h-full">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/checkin" element={
                  <ProtectedRoute>
                    <CheckInPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/gym/:id" element={<GymProfile />} />
                <Route path="/plans" element={<SubscriptionPlans />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/gym-dashboard" element={
                  <ProtectedRoute>
                    <GymDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <InstallPrompt />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
