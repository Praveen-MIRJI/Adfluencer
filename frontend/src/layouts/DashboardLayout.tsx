import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Megaphone, LayoutDashboard, FileText, Search, User, MessageSquare,
  LogOut, Menu, X, Users, Bookmark, Star, Image, FileCheck,
  ChevronDown, Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '../components/Notifications';
import HelpCenter from '../components/HelpCenter';
import api from '../lib/api';

const clientNav = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Post Ad', href: '/client/post-ad', icon: FileText },
  { name: 'My Ads', href: '/client/my-ads', icon: Megaphone },
  { name: 'Discover Influencers', href: '/client/discover', icon: Users },
  { name: 'Contracts', href: '/client/contracts', icon: FileCheck },
  { name: 'Messages', href: '/client/messages', icon: MessageSquare },
];

const influencerNav = [
  { name: 'Dashboard', href: '/influencer/dashboard', icon: LayoutDashboard },
  { name: 'Browse Ads', href: '/influencer/browse', icon: Search },
  { name: 'My Bids', href: '/influencer/my-bids', icon: FileText },
  { name: 'Saved Ads', href: '/influencer/saved', icon: Bookmark },
  { name: 'Contracts', href: '/influencer/contracts', icon: FileCheck },
  { name: 'Portfolio', href: '/influencer/portfolio', icon: Image },
  { name: 'Reviews', href: '/influencer/reviews', icon: Star },
  { name: 'Messages', href: '/influencer/messages', icon: MessageSquare },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
];

export default function DashboardLayout() {
  const { user, logout, setAuth, token } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch latest user data including profile on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data && token) {
          // Use setAuth to fully replace user data with fresh data from server
          setAuth(res.data.data, token);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, [setAuth, token]);

  const navItems = user?.role === 'CLIENT' ? clientNav 
    : user?.role === 'INFLUENCER' ? influencerNav 
    : adminNav;

  const profileHref = user?.role === 'CLIENT' ? '/client/profile' 
    : user?.role === 'INFLUENCER' ? '/influencer/profile' 
    : '/admin/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.role === 'CLIENT' 
    ? user.clientProfile?.companyName || user.email?.split('@')[0]
    : user?.role === 'INFLUENCER'
    ? user.influencerProfile?.displayName || user.email?.split('@')[0]
    : user?.email?.split('@')[0];

  const avatarUrl = user?.role === 'CLIENT'
    ? user.clientProfile?.avatar
    : user?.role === 'INFLUENCER'
    ? user.influencerProfile?.avatar
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">InfluenceHub</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1 h-[calc(100%-4rem)] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            
            {/* Right side - Notifications & Profile */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to={profileHref}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        View Profile
                      </Link>
                      <Link
                        to={profileHref}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Edit Profile
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Help Center - Only for Client and Influencer */}
      {(user?.role === 'CLIENT' || user?.role === 'INFLUENCER') && (
        <HelpCenter userRole={user.role} />
      )}
    </div>
  );
}
