import { KeyRound, LayoutDashboard, LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";

import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import BrandLogo from "./components/BrandLogo";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Dashboard from "./pages/Dashboard";
import FileDetail from "./pages/FileDetail";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Passwords from "./pages/Passwords";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import SettingsPage from "./pages/Settings";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import { Link, RouterProvider, useLocation, useNavigate } from "./router";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider>
              <RouteSwitch />
            </RouterProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function RouteSwitch() {
  const { pathname } = useLocation();
  const protectedPage = getProtectedPage(pathname);

  if (pathname === "/" || pathname === "") return <Landing />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/signup") return <Signup />;
  if (pathname === "/verify-email") return <VerifyEmail />;
  if (pathname === "/forgot-password") return <ForgotPassword />;
  if (pathname === "/reset-password") return <ResetPassword />;
  if (protectedPage) {
    return (
      <ProtectedRoute>
        <AppShell>{protectedPage}</AppShell>
      </ProtectedRoute>
    );
  }

  return <NotFound />;
}

function getProtectedPage(pathname) {
  if (pathname === "/dashboard") return <Dashboard />;
  if (pathname === "/passwords") return <Passwords />;
  if (pathname === "/profile") return <Profile />;
  if (pathname === "/settings") return <SettingsPage />;
  if (/^\/file\/[^/]+$/.test(pathname)) return <FileDetail />;
  return null;
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const { user, logout, isVaultUnlocked } = useAuth();
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard">
          <BrandLogo />
        </Link>
        <nav className="nav-list" aria-label="Primary">
          <Link to="/dashboard">
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </Link>
          <Link to="/passwords">
            <KeyRound size={18} aria-hidden="true" />
            Passwords
          </Link>
          <Link to="/profile">
            <UserRound size={18} aria-hidden="true" />
            Profile
          </Link>
          <Link to="/settings">
            <Settings size={18} aria-hidden="true" />
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{user?.username?.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user?.username}</strong>
              <small>{isVaultUnlocked ? "Vault unlocked" : "Vault locked"}</small>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button danger" type="button" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      {children}
    </div>
  );
}
