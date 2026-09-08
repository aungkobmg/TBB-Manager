import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Breadcrumb, Space } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { getUsers, updateUser, verifyPassword, logActivity } from '../utils/storage';
import { useAuth, useToast } from '../App';

const { Title, Text } = Typography;

export default function ChangePassword() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      const users = getUsers();
      const currentUser = users.find(u => u.id === user!.userId);

      if (!currentUser) {
        message.error('User not found');
        return;
      }

      if (!verifyPassword(values.currentPassword, currentUser.passwordHash)) {
        message.error('Current password is incorrect');
        return;
      }

      // Update password
      updateUser(currentUser.id, { passwordHash: values.newPassword });

      // Log activity
      logActivity(user!.userId, 'Password Changed', 'user', currentUser.id, 'Password updated');

      showToast('Password changed successfully');
      form.resetFields();
      navigate('/settings');
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Link to="/settings">Settings</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Change Password</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings')}>
          Back to Settings
        </Button>
      </div>

      <Card style={{ maxWidth: 500 }}>
        <Title level={3}>Change Password</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Update your account password. Make sure to use a strong password.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: 'Please enter your current password' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                Change Password
              </Button>
              <Button onClick={() => navigate('/settings')} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
