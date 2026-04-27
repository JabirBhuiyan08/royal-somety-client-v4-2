// client/src/components/BottomNav.jsx (Completely inline, no CSS files needed)
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Phone, User } from 'lucide-react';

const navItems = [
  { to: '/',         icon: Home,   label: 'হোম'    },
  { to: '/emergency', icon: Phone, label: 'জরুরি'  },
  { to: '/profile',  icon: User,  label: 'প্রোফাইল'},
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      <nav 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around py-1.5 px-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink 
                key={to} 
                to={to} 
                end={to === '/'}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                  active ? 'bg-blue-50' : ''
                }`}
              >
                <Icon 
                  size={22} 
                  strokeWidth={active ? 2.5 : 1.8} 
                  className={active ? 'text-blue-600' : 'text-gray-400'}
                />
                <span 
                  className={`font-medium text-[10px] ${
                    active ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      <div className="h-[70px]" />
    </>
  );
};

export default BottomNav;