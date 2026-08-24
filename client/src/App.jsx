import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar/Navbar';
import Footer from './components/layout/Footer/Footer';
import Spinner from './components/ui/Spinner';

/* ── Public & User Pages ── */
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import MagicLinkCallbackPage from './pages/Auth/MagicLinkCallbackPage';
import PersonalDevPage from './pages/PersonalDev/PersonalDevPage';
import FashionPage from './pages/Fashion/FashionPage';
import BrandsPage from './pages/Brands/BrandsPage';
import WardrobePage from './pages/Wardrobe/WardrobePage';
import OutfitsPage from './pages/Outfits/OutfitsPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import RecommendationsPage from './pages/Recommendations/RecommendationsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import CommunityPage from './pages/Community/CommunityPage';
import AboutPage from './pages/About/AboutPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

/* ── Admin Command Center Modules ── */
import AdminShell from './pages/Admin/AdminShell';
import CommandCenter from './pages/Admin/CommandCenter';
import UserManagement from './pages/Admin/UserManagement';
import BrandManagement from './pages/Admin/BrandManagement';
import FashionManagement from './pages/Admin/FashionManagement';
import MediaLibrary from './pages/Admin/MediaLibrary';
import ModerationQueue from './pages/Admin/ModerationQueue';
import Analytics from './pages/Admin/Analytics';
import AuditLog from './pages/Admin/AuditLog';
import SystemHealth from './pages/Admin/SystemHealth';
import AdminAccount from './pages/Admin/AdminAccount';

/* ── 1. User Workspace Route Guard (Strict User-Only) ── */
function UserWorkspaceRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admins must never enter User lifestyle workspace
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

/* ── 2. Admin Route Guard (Strict Admin-Only) ── */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ── 3. Guest Route Guard ── */
function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

/* ── 4. Public Layout Shell (Public Navbar + Footer) ── */
function PublicLayout() {
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="app-layout__main" style={{ paddingTop: '72px' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* ── Public & User Routes ── */}
      <Route element={<PublicLayout />}>
        {/* Public Discovery / Content (Accessible to all including Admin Preview) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/fashion" element={<FashionPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/magic-link" element={<MagicLinkCallbackPage />} />

        {/* Guest Authentication Pages */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        {/* User-Only Personal Lifestyle Workspace */}
        <Route path="/dashboard" element={<UserWorkspaceRoute><DashboardPage /></UserWorkspaceRoute>} />
        <Route path="/personal-development" element={<UserWorkspaceRoute><PersonalDevPage /></UserWorkspaceRoute>} />
        <Route path="/wardrobe" element={<UserWorkspaceRoute><WardrobePage /></UserWorkspaceRoute>} />
        <Route path="/outfits" element={<UserWorkspaceRoute><OutfitsPage /></UserWorkspaceRoute>} />
        <Route path="/recommendations" element={<UserWorkspaceRoute><RecommendationsPage /></UserWorkspaceRoute>} />
        <Route path="/profile" element={<UserWorkspaceRoute><ProfilePage /></UserWorkspaceRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin Operations Command Center (Fully Isolated Shell) ── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminShell />
          </AdminRoute>
        }
      >
        <Route index element={<CommandCenter />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="brands" element={<BrandManagement />} />
        <Route path="fashion" element={<FashionManagement />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="reports" element={<ModerationQueue />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="system" element={<SystemHealth />} />
        <Route path="profile" element={<AdminAccount />} />
      </Route>
    </Routes>
  );
}

export default App;
