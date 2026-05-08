import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../features/auth/authSlice';
import { useAuth } from '../features/auth/useAuth';
import NotificationBell from '../components/NotificationBell';

interface HeaderProps { onMenuClick: () => void; }

export default function Header({ onMenuClick }: HeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition md:hidden"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Nakasero Market — Live
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Real notification bell */}
        <NotificationBell />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
              {user?.name.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:block max-w-[120px] truncate">
              {user?.name}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700 flex-shrink-0">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Profile link */}
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My profile
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
