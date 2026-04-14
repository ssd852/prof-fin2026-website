import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { useStore } from './hooks/useStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import EntityPage from './pages/EntityPage';
import FoodInventoryPage from './pages/FoodInventoryPage';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import PLModal from './components/PLModal';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="text-surface-400 text-sm mt-4">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Auth Route wrapper (redirect to dashboard if already logged in)
function AuthRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="text-surface-400 text-sm mt-4">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// Protected Dashboard Shell
function DashboardShell() {
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [plOpen, setPlOpen] = useState(false);
  const store = useStore();

  const toggle = () => setSidebarOpen((p) => !p);
  const close = () => setSidebarOpen(false);

  // Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    const handleOpenCmd = () => setCmdOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('openCmd', handleOpenCmd);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('openCmd', handleOpenCmd);
    };
  }, []);

  const handleNav = (key) => {
    if (key === 'pnl') setPlOpen(true);
    else setSection(key);
  };

  return (
    <CurrencyProvider>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-surface-950 relative">
          {/* Background Orbs */}
          <div className="gradient-orb animate-pulse-glow" style={{ width: 420, height: 420, background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', top: -120, left: -120 }} />
          <div className="gradient-orb animate-pulse-glow" style={{ width: 320, height: 320, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', bottom: -80, right: -80, animationDelay: '2.5s' }} />

          {/* Sidebar */}
          <Sidebar active={section} onNav={handleNav} isOpen={sidebarOpen} onClose={close} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-3 md:p-5 bg-grid relative">
            {section === 'dashboard' ? (
              <DashboardPage store={store} onToggle={toggle} />
            ) : section === 'food_inventory' ? (
              <FoodInventoryPage store={store} onToggle={toggle} />
            ) : (
              <EntityPage key={section} entityKey={section} store={store} onToggle={toggle} />
            )}
          </main>
        </div>

        {/* Global Overlays */}
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} store={store} onNavigate={handleNav} />
        <PLModal isOpen={plOpen} onClose={() => setPlOpen(false)} store={store} />
      </ToastProvider>
    </CurrencyProvider>
  );
}

// Main App
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />

        {/* Protected Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>} />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
