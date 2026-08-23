import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Spinner from './components/ui/Spinner';

/* ── Public & User Pages ── */
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
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

/* ── Protected Route Guard ── */
function ProtectedRoute({ children, adminOnly = false }) {
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

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ── Guest-only Route Guard ── */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ── Public Layout Shell (Public Navbar + Footer) ── */
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
      {/* Public & Customer Routes — uses PublicLayout with Navbar & Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/personal-development" element={<ProtectedRoute><PersonalDevPage /></ProtectedRoute>} />
        <Route path="/fashion" element={<FashionPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/wardrobe" element={<ProtectedRoute><WardrobePage /></ProtectedRoute>} />
        <Route path="/outfits" element={<ProtectedRoute><OutfitsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Operations Command Center — FULLY ISOLATED SHELL (No Public Navbar/Footer) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell />
          </ProtectedRoute>
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
      </Route>
    </Routes>
  );
}

export default App;
