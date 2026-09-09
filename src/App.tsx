import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme, message, Button, Dropdown, Space, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  TagsOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  AuditOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { authApi } from './api/services';
import { ApiError } from './api/client';
import type { User } from './api/services';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bales = lazy(() => import('./pages/Bales'));
const BaleDetail = lazy(() => import('./pages/BaleDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Customers = lazy(() => import('./pages/Customers'));
const QuickOrder = lazy(() => import('./pages/QuickOrder'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const VoucherView = lazy(() => import('./pages/VoucherView'));
const Finance = lazy(() => import('./pages/Finance'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));

const { Header, Sider, Content } = Layout;

import React from 'react';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({ user: null, setUser: () => {}, loading: true });
export const useAuth = () => React.useContext(AuthContext);

// Brand colors
const BRAND_PRIMARY = '#0057B8';
const BRAND_DARK = '#0A1930';

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore errors on logout
    }
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/quick-order', icon: <PlusCircleOutlined />, label: 'Quick Order' },
    { key: '/bales', icon: <InboxOutlined />, label: 'Bales' },
    { key: '/inventory', icon: <TagsOutlined />, label: 'Inventory' },
    { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Orders' },
    { key: '/finance', icon: <DollarOutlined />, label: 'Finance' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/activity-logs', icon: <AuditOutlined />, label: 'Activity Logs' },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'change-password', icon: <SettingOutlined />, label: 'Change Password' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'change-password') {
      navigate('/change-password');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold', color: BRAND_PRIMARY }}>TBB</span>
          ) : (
            <span style={{ fontSize: 16, fontWeight: 'bold', color: BRAND_PRIMARY }}>TBB OS</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <UserOutlined />
              <span>{user.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/bales" element={<Bales />} />
              <Route path="/bales/:id" element={<BaleDetail />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/quick-order" element={<QuickOrder />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/voucher/:id" element={<VoucherView />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await authApi.me();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (err) {
        // Not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: BRAND_PRIMARY,
          borderRadius: 6,
        },
      }}
    >
      <AuthContext.Provider value={{ user, setUser, loading }}>
        <Router>
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
                <Login />
              </Suspense>
            } />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ConfigProvider>
  );
}

export default App;
