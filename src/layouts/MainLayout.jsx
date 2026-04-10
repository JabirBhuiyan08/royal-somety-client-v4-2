// client/src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const MainLayout = () => (
  <div className="app-container">
    <Navbar />
    <main className="page-enter" style={{ paddingBottom: 72 }}><Outlet /></main>
    <div className="text-center py-3 text-gray-400 bg-gray-50 fixed bottom-14 w-full">
      <p className="text-xs">Powered by JABNOX.COM</p>
      <p className="text-[10px]">© Copyright @ Jabnox</p>
    </div>
    <BottomNav />
  </div>
);
export default MainLayout;
