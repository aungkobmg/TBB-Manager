import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authApi } from '../api/services';

const { Title, Text } = Typography;

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      message.success('Password changed successfully');
      form.resetFields();
      navigate('/settings');
    } catch (err) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings')}>Back to Settings</Button>
      </Space>

      <Card style={{ maxWidth: 500 }}>
        <Title level={3}>Change Password</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Update your account password. Make sure to use a strong password.
        </Text>

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please enter your current password' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" size="large" />
          </Form.Item>

          <Form.Item name="newPassword" label="New Password" rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" size="large" />
          </Form.Item>

          <Form.Item name="confirmPassword" label="Confirm New Password" dependencies={['newPassword']} rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">Change Password</Button>
              <Button onClick={() => navigate('/settings')} size="large">Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
