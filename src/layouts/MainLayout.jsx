// client/src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
const MainLayout = () => (
  <div className="app-container">
    <Navbar />
    <main className="page-enter" style={{ paddingBottom: 72 }}><Outlet /></main>
    <BottomNav />
  </div>
);
export default MainLayout;
