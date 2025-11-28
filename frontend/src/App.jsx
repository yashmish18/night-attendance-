import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import WardenDashboard from './pages/WardenDashboard';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    // Redirect to their appropriate dashboard if role mismatch
    return <Navigate to={user.role === 'warden' ? '/warden' : '/student'} />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'warden' ? '/warden' : '/student'} /> : <Login />} />

      <Route path="/student" element={
        <PrivateRoute role="student">
          <StudentDashboard />
        </PrivateRoute>
      } />

      <Route path="/warden" element={
        <PrivateRoute role="warden">
          <WardenDashboard />
        </PrivateRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'warden' ? '/warden' : '/student') : '/login'} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
