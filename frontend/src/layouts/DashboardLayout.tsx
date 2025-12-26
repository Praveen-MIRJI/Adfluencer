import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Megaphone, LayoutDashboard, FileText, Search, User, MessageSquare,
  LogOut, Menu, X, Users, Bookmark, Star, Image, FileCheck,
  ChevronDown, Settings, Shield, CreditCard
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '../components/Notifications';
import HelpCenter from '../components/HelpCenter';
import VerificationBadge from '../components/VerificationBadge';
import api from '../lib/api';

const clientNav = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Post Ad', href: '/client/post-ad', icon: FileText },
  { name: 'My Ads', href: '/client/my-ads', icon: Megaphone },
  { name: 'Discover Influencers', href: '/client/discover', icon: Users },
  { name: 'Contracts', href: '/client/contracts', icon: FileCheck },
  { name: 'Messages', href: '/client/messages', icon: MessageSquare },
  { name: 'KYC Verification', href: '/client/kyc', icon: Shield },
  { name: 'Billing & Plans', href: '/client/billing', icon: CreditCard },
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
  { name: 'KYC Verification', href: '/influencer/kyc', icon: Shield },
  { name: 'Billing & Plans', href: '/influencer/billing', icon: CreditCard },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
  { name: 'Contracts', href: '/admin/contracts', icon: FileCheck },
  { name: 'Bids', href: '/admin/bids', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: Settings },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'KYC Review', href: '/admin/kyc', icon: Shield },
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
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <img src="/adfluencer-logo.png" alt="Adfluencer" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold text-white tracking-tight">Adfluencer</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 h-[calc(100%-8rem)] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />

            {/* Right side - Verification, Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Verification Badge - Only for Client and Influencer */}
              {(user?.role === 'CLIENT' || user?.role === 'INFLUENCER') && (
                <VerificationBadge />
              )}
              
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white max-w-[120px] truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to={profileHref}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </Link>
                      <Link
                        to={profileHref}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Edit Profile
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors"
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
