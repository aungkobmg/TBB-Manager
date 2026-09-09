import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api/services';
import { setSession } from '../utils/storage';
import { useAuth } from '../App';
import { ApiError } from '../api/client';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(values.username, values.password);
      if (response.success && response.data?.user) {
        const user = response.data.user;
        setUser(user);
        setSession(user.id, user.username);
        message.success('Welcome back!');
        navigate('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0057B8 0%, #0A1930 100%)',
      padding: 24,
    }}>
      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: '#0057B8',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 'bold', fontSize: 24, marginBottom: 16,
          }}>TBB</div>
          <Title level={3} style={{ marginBottom: 4, color: '#0A1930' }}>TBB OS</Title>
          <Text type="secondary">The Bra Boutique (Yangon)</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}

        <Form name="login" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter your username' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontWeight: 500 }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Please contact your administrator for credentials.</Text>
        </div>
      </Card>
    </div>
  );
}
