import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  initializeApp, getSession, setSession, clearSession, getSettings,
  logActivity, verifyPassword
} from './utils/storage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bales from './pages/Bales';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import QuickOrder from './pages/QuickOrder';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import VoucherView from './pages/VoucherView';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';

// Toast context
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
const ToastContext = createContext<{ showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

// Auth context
interface AuthContextType {
  user: { userId: number; username: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType>({ user: null, login: () => false, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ userId: number; username: string } | null>(getSession());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const login = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('tbb_users') || '[]');
    const found = users.find((u: any) => u.username === username);
    if (found && verifyPassword(password, found.passwordHash)) {
      setSession(found.id, found.username);
      setUser({ userId: found.id, username: found.username });
      logActivity(found.id, 'Login', 'auth', null, `User ${username} logged in`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) logActivity(user.userId, 'Logout', 'auth', null, `User ${user.username} logged out`);
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ToastContext.Provider value={{ showToast }}>
        {children}
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

// Protected Route
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Layout with sidebar
function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const settings = getSettings();

  const navItems = [
    { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/bales', icon: 'fa-box', label: 'Bales' },
    { path: '/inventory', icon: 'fa-tags', label: 'Inventory' },
    { path: '/customers', icon: 'fa-users', label: 'Customers' },
    { path: '/quick-order', icon: 'fa-bolt', label: 'Quick Order' },
    { path: '/orders', icon: 'fa-clipboard-list', label: 'Orders' },
    { path: '/finance', icon: 'fa-wallet', label: 'Finance' },
    { path: '/reports', icon: 'fa-chart-bar', label: 'Reports' },
    { path: '/settings', icon: 'fa-cog', label: 'Settings' },
    { path: '/activity-logs', icon: 'fa-history', label: 'Activity Logs' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A1930] text-white transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/10">
          <h1 className="text-lg font-bold text-white">{settings.businessName}</h1>
          <p className="text-xs text-gray-400 mt-1">TBB Operating System</p>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-[#0057B8] text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400"><i className="fas fa-user mr-2"></i>{user?.username}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
            <i className="fas fa-bars text-lg"></i>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/quick-order" className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82] transition-colors">
              <i className="fas fa-bolt mr-2"></i>Quick Order
            </Link>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  useEffect(() => { initializeApp(); }, []);

  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/bales" element={<Bales />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/quick-order" element={<QuickOrder />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/voucher/:id" element={<VoucherView />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/activity-logs" element={<ActivityLogs />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}
