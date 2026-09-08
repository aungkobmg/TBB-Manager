import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme, message, Button, Dropdown, Space } from 'antd';
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
import { initializeApp, getSession, clearSession, logActivity } from './utils/storage';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bales from './pages/Bales';
import BaleDetail from './pages/BaleDetail';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import Customers from './pages/Customers';
import QuickOrder from './pages/QuickOrder';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import VoucherView from './pages/VoucherView';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import ActivityLogs from './pages/ActivityLogs';

const { Header, Sider, Content } = Layout;

// Context for toast and auth
import React from 'react';

interface ToastContextType {
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

interface AuthContextType {
  user: { userId: number; username: string } | null;
  setUser: (user: { userId: number; username: string } | null) => void;
}

export const ToastContext = React.createContext<ToastContextType>({ showToast: () => {} });
export const AuthContext = React.createContext<AuthContextType>({ user: null, setUser: () => {} });

export const useToast = () => React.useContext(ToastContext);
export const useAuth = () => React.useContext(AuthContext);

// Brand colors for Ant Design theme
const BRAND_PRIMARY = '#0057B8';
const BRAND_DARK = '#0A1930';

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ userId: number; username: string } | null>(getSession());
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();

  const showToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    messageApi.open({ type, content: msg });
  };

  const handleLogout = () => {
    if (user) {
      logActivity(user.userId, 'Logout', 'auth', null, `${user.username} logged out`);
    }
    clearSession();
    setUser(null);
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/bales', icon: <InboxOutlined />, label: 'Bales' },
    { key: '/inventory', icon: <TagsOutlined />, label: 'Inventory' },
    { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
    {
      key: 'orders-group',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
      children: [
        { key: '/quick-order', icon: <PlusCircleOutlined />, label: 'Quick Order' },
        { key: '/orders', icon: <FileTextOutlined />, label: 'All Orders' },
      ],
    },
    { key: '/finance', icon: <DollarOutlined />, label: 'Finance' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/activity-logs', icon: <AuditOutlined />, label: 'Activity Logs' },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <ToastContext.Provider value={{ showToast }}>
        {contextHolder}
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
            }}
          >
            <div style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
              padding: '0 16px',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: BRAND_PRIMARY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                marginRight: collapsed ? 0 : 12,
              }}>
                TBB
              </div>
              {!collapsed && (
                <span style={{ fontWeight: 600, fontSize: 15, color: BRAND_DARK }}>
                  TBB OS
                </span>
              )}
            </div>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              defaultOpenKeys={['orders-group']}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ borderRight: 0, marginTop: 8 }}
            />
          </Sider>
          <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
            <Header style={{
              padding: '0 24px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              height: 64,
            }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 16 }}
              />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: BRAND_PRIMARY,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 13,
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14 }}>{user.username}</span>
                </Space>
              </Dropdown>
            </Header>
            <Content style={{ margin: 24, minHeight: 280 }}>
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
            </Content>
          </Layout>
        </Layout>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: BRAND_PRIMARY,
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Menu: {
            itemSelectedBg: '#E6F0FF',
            itemSelectedColor: BRAND_PRIMARY,
          },
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
