import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getSettings } from '../utils/storage';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password.'); return; }
    const success = login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1930] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{settings.businessName}</h1>
          <p className="text-gray-400 mt-2">Business Operating System</p>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0057B8] focus:border-transparent outline-none"
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0057B8] focus:border-transparent outline-none"
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="w-full bg-[#0057B8] text-white py-2.5 rounded-lg font-medium hover:bg-[#003d82] transition-colors">
              Sign In
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4 text-center">Default: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}
