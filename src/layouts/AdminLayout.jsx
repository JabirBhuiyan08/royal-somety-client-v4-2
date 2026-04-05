// client/src/layouts/AdminLayout.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import Navbar from '../components/Navbar';
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';

const AdminLayout = () => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen message="অ্যাডমিন যাচাই হচ্ছে..." />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return (
    <div className="app-container">
      <Navbar />
      <main className="page-enter pb-5"><Outlet /></main>
      <BottomNav />
    </div>
  );
};
export default AdminLayout;
