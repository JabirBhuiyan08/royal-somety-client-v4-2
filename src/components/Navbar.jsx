// client/src/components/Navbar.jsx
import { useState } from 'react';
import { Menu, X, LayoutDashboard, CheckSquare, Users, Bell, Settings, LogOut, MessageCircle, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import useNotifications from '../hooks/useNotifications';
import LogoImage from '../../assets/Logo.png';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, logout, dbUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const adminItems = [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', to: '/admin/dashboard', color: 'blue' },
    { icon: CheckSquare, label: 'পেমেন্ট অনুমোদন', to: '/admin/payments', color: 'green' },
    { icon: Users, label: 'সদস্য ব্যবস্থাপনা', to: '/admin/members', color: 'purple' },
    { icon: Bell, label: 'নোটিফিকেশন', to: '/admin/notifications', color: 'orange' },
    { icon: Settings, label: 'সেটিংস', to: '/admin/settings', color: 'gray' },
  ];

  const go = (to) => { 
    navigate(to); 
    setOpen(false); 
  };

  return (
    <>
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-[480px] mx-auto">
          {/* Left Button - Message for both admin and regular users */}
          <Link 
            to="/chat" 
            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
          >
            <MessageCircle size={20} className="text-gray-600" />
          </Link>

          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <img src={LogoImage} alt="Logo" className="w-8 h-8 object-contain" />
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800 tracking-tight">
                ভাই ভাই
              </h1>
              <p className="text-[10px] text-gray-400 mt-0.5">রয়্যাল সমিতি <span className="text-[9px]">by Jabnox.com</span></p>
            </div>
          </div>

          {/* Right Side - Menu/Admin Panel Button & Notifications */}
          <div className="flex items-center gap-2">
            {/* Notifications Button */}
            <Link 
              to="/notifications" 
              className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center font-bold shadow-sm" 
                      style={{ fontSize: 9, padding: '0 4px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Admin Menu Button - Only for admin */}
            {isAdmin && (
              <button 
                onClick={() => setOpen(true)} 
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Menu - Admin Panel */}
      <aside 
        className={`fixed top-0 left-0 h-full z-50 w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-base">অ্যাডমিন প্যানেল</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-blue-100">{dbUser?.name || 'অ্যাডমিন'}</p>
                {dbUser?.bloodGroup && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/30 text-white">
                    🩸 {dbUser.bloodGroup}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Home Link for Admin */}
          <button 
            onClick={() => go('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-50 transition-all flex items-center justify-center">
              <Home size={18} className="text-gray-600 group-hover:text-blue-600 transition-all" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-all">হোম</span>
          </button>

          {/* Chat Link for Admin */}
          <button 
            onClick={() => go('/chat')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 group-hover:bg-green-100 transition-all flex items-center justify-center">
              <MessageCircle size={18} className="text-green-600 group-hover:text-green-700 transition-all" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-all">মেসেজ</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-3 mx-2" />

          {adminItems.map(({ icon: Icon, label, to, color }) => {
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
              green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
              purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
              orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
              gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
            };
            
            return (
              <button 
                key={to} 
                onClick={() => go(to)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${colorClasses[color]}`}>
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-all">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t mb-10 border-gray-100 bg-gray-50">
          <button 
            onClick={async () => { 
              setOpen(false); 
              await logout(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 group-hover:bg-red-200 transition-all flex items-center justify-center">
              <LogOut size={18} className="text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-600 group-hover:text-red-700 transition-all">
              লগআউট
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;