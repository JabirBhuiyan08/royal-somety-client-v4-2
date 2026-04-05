// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import LoadingScreen from './components/LoadingScreen';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Emergency from './pages/Emergency';
import Gallery from './pages/Gallery';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/AdminDashboard';
import AdminPayments from './pages/AdminPayments';
import AdminMembers from './pages/AdminMembers';
import AdminNotifications from './pages/AdminNotifications';
import AdminSettings from './pages/AdminSettings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

      {/* Member layout */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="gallery"       element={<Gallery />} />
        <Route path="wallet"        element={<Wallet />} />
        <Route path="emergency"     element={<Emergency />} />
        <Route path="profile"       element={<Profile />} />
        <Route path="chat"          element={<Chat />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Admin layout */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard"     element={<AdminDashboard />} />
        <Route path="payments"      element={<AdminPayments />} />
        <Route path="members"       element={<AdminMembers />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings"      element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryProvider>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f0f0f0',
              border: '1px solid rgba(226,185,111,0.25)',
              borderRadius: '12px',
              fontFamily: "'Hind Siliguri', sans-serif",
              fontSize: '14px',
              maxWidth: '360px',
            },
            success: { iconTheme: { primary: '#e2b96f', secondary: '#1a1a2e' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#1a1a2e' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </QueryProvider>
);

export default App;
