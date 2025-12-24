import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

// Client pages
import ClientDashboard from './pages/client/Dashboard';
import PostAdvertisement from './pages/client/PostAdvertisement';
import MyAdvertisements from './pages/client/MyAdvertisements';
import ClientAdDetails from './pages/client/AdvertisementDetails';
import DiscoverInfluencers from './pages/client/DiscoverInfluencers';
import InfluencerProfilePage from './pages/client/InfluencerProfile';
import ClientProfile from './pages/client/Profile';

// Influencer pages
import InfluencerDashboard from './pages/influencer/Dashboard';
import BrowseAds from './pages/influencer/BrowseAds';
import AdDetails from './pages/influencer/AdDetails';
import MyBids from './pages/influencer/MyBids';
import Profile from './pages/influencer/Profile';
import Portfolio from './pages/influencer/Portfolio';
import SavedAds from './pages/influencer/SavedAds';
import InfluencerReviews from './pages/influencer/Reviews';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageAds from './pages/admin/ManageAds';
import AdminContracts from './pages/admin/Contracts';
import AdminBids from './pages/admin/Bids';
import AdminCategories from './pages/admin/Categories';
import AdminReviews from './pages/admin/Reviews';

// Common pages
import Messages from './pages/Messages';
import Contracts from './pages/Contracts';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'CLIENT': return '/client/dashboard';
      case 'INFLUENCER': return '/influencer/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={isAuthenticated ? <Navigate to={getDashboardRoute()} /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={getDashboardRoute()} /> : <Login />} />
        <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Client routes */}
      <Route element={<ProtectedRoute roles={['CLIENT']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/post-ad" element={<PostAdvertisement />} />
        <Route path="/client/my-ads" element={<MyAdvertisements />} />
        <Route path="/client/advertisements/:id" element={<ClientAdDetails />} />
        <Route path="/client/discover" element={<DiscoverInfluencers />} />
        <Route path="/client/influencers/:id" element={<InfluencerProfilePage />} />
        <Route path="/client/contracts" element={<Contracts />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/messages" element={<Messages />} />
      </Route>

      {/* Influencer routes */}
      <Route element={<ProtectedRoute roles={['INFLUENCER']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
        <Route path="/influencer/browse" element={<BrowseAds />} />
        <Route path="/influencer/ads/:id" element={<AdDetails />} />
        <Route path="/influencer/my-bids" element={<MyBids />} />
        <Route path="/influencer/profile" element={<Profile />} />
        <Route path="/influencer/portfolio" element={<Portfolio />} />
        <Route path="/influencer/saved" element={<SavedAds />} />
        <Route path="/influencer/reviews" element={<InfluencerReviews />} />
        <Route path="/influencer/contracts" element={<Contracts />} />
        <Route path="/influencer/messages" element={<Messages />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/advertisements" element={<ManageAds />} />
        <Route path="/admin/contracts" element={<AdminContracts />} />
        <Route path="/admin/bids" element={<AdminBids />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
