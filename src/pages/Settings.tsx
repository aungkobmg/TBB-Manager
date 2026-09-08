import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Tabs, Divider, Space, message, Modal } from 'antd';
import { SettingOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getSettings, updateSettings, getUsers, updateUser, verifyPassword, logActivity } from '../utils/storage';

const { Title, Text } = Typography;

export default function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [settingsForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [settings] = useState(getSettings());

  const handleSaveSettings = (values: any) => {
    updateSettings(values);
    logActivity(user!.userId, 'Settings Updated', 'settings', null, 'Business settings updated');
    showToast('Settings saved successfully');
  };

  const handleChangePassword = (values: any) => {
    const users = getUsers();
    const currentUser = users.find(u => u.id === user!.userId);
    if (!currentUser) return;

    if (!verifyPassword(values.currentPassword, currentUser.passwordHash)) {
      showToast('Current password is incorrect', 'error');
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (values.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    // In production, this would be hashed on the server
    const hashPassword = (password: string): string => {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
    };

    updateUser(user!.userId, { passwordHash: hashPassword(values.newPassword) });
    logActivity(user!.userId, 'Password Changed', 'auth', null, 'Password changed');
    showToast('Password changed successfully');
    passwordForm.resetFields();
  };

  const handleExportDatabase = () => {
    const data = {
      settings: getSettings(),
      bales: JSON.parse(localStorage.getItem('tbb_bales') || '[]'),
      products: JSON.parse(localStorage.getItem('tbb_products') || '[]'),
      customers: JSON.parse(localStorage.getItem('tbb_customers') || '[]'),
      orders: JSON.parse(localStorage.getItem('tbb_orders') || '[]'),
      expenses: JSON.parse(localStorage.getItem('tbb_expenses') || '[]'),
      activityLogs: JSON.parse(localStorage.getItem('tbb_activity_logs') || '[]'),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tbb-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity(user!.userId, 'Database Exported', 'backup', null, 'Database backup exported');
    showToast('Database backup downloaded');
  };

  const tabItems = [
    {
      key: 'business',
      label: <span><SettingOutlined /> Business Settings</span>,
      children: (
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSaveSettings}
          initialValues={settings}
          style={{ maxWidth: 600 }}
        >
          <Form.Item name="businessName" label="Business Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input />
          </Form.Item>
          <Form.Item name="facebook" label="Facebook Page">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Business Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="voucherFooter" label="Voucher Footer Message">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="currency" label="Currency">
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save Settings</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'password',
      label: <span><LockOutlined /> Change Password</span>,
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ maxWidth: 500 }}
        >
          <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please enter current password' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Please enter new password' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Confirm New Password" rules={[{ required: true, message: 'Please confirm new password' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Change Password</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'backup',
      label: <span><DatabaseOutlined /> Backup</span>,
      children: (
        <div style={{ maxWidth: 600 }}>
          <Card>
            <Title level={5}>Database Backup</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Export all business data as a JSON backup file. This includes bales, products, customers, orders, expenses, and activity logs.
            </Text>
            <Button type="primary" icon={<DatabaseOutlined />} onClick={handleExportDatabase}>
              Export Database Backup
            </Button>
            <Divider />
            <Text type="secondary" style={{ fontSize: 12 }}>
              For production deployment with MySQL, use phpMyAdmin or command-line tools to create SQL backups.
            </Text>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
