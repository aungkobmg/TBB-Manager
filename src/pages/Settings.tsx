import { useState } from 'react';
import { useToast, useAuth } from '../App';
import { getSettings, updateSettings, logActivity, verifyPassword, getUsers, updateUser } from '../utils/storage';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState(getSettings());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    logActivity(user!.userId, 'Settings Updated', 'settings', null, 'Business settings updated');
    showToast('Settings saved successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('Please fill all password fields.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    const users = getUsers();
    const currentUser = users.find(u => u.id === user!.userId);
    if (!currentUser || !verifyPassword(passwordForm.currentPassword, currentUser.passwordHash)) {
      showToast('Current password is incorrect.', 'error');
      return;
    }

    // Simple hash update
    let hash = 0;
    for (let i = 0; i < passwordForm.newPassword.length; i++) {
      const char = passwordForm.newPassword.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const newHash = 'h_' + Math.abs(hash).toString(36) + '_' + passwordForm.newPassword.length;
    updateUser(user!.userId, { passwordHash: newHash });
    logActivity(user!.userId, 'Password Changed', 'auth', null, 'Password changed');
    showToast('Password changed successfully.');
    setShowPasswordForm(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleExportBackup = () => {
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
    a.download = `tbb-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity(user!.userId, 'Backup Exported', 'system', null, 'Database backup exported');
    showToast('Backup downloaded.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4"><i className="fas fa-building mr-2 text-[#0057B8]"></i>Business Information</h2>
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
              <input type="text" value={settings.businessName} onChange={e => setSettings({...settings, businessName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
              <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Facebook Page</label>
              <input type="text" value={settings.facebook} onChange={e => setSettings({...settings, facebook: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Business Address</label>
              <textarea value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Voucher Footer Message</label>
              <input type="text" value={settings.voucherFooter} onChange={e => setSettings({...settings, voucherFooter: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <input type="text" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button type="submit" className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
              <i className="fas fa-save mr-2"></i>Save Settings
            </button>
          </form>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4"><i className="fas fa-lock mr-2 text-[#0057B8]"></i>Security</h2>
            {!showPasswordForm ? (
              <button onClick={() => setShowPasswordForm(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                <i className="fas fa-key mr-2"></i>Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">Update Password</button>
                  <button type="button" onClick={() => setShowPasswordForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Backup */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4"><i className="fas fa-database mr-2 text-[#0057B8]"></i>Backup</h2>
            <p className="text-sm text-gray-600 mb-3">Export all business data as a JSON backup file.</p>
            <button onClick={handleExportBackup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <i className="fas fa-download mr-2"></i>Export Database Backup
            </button>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4"><i className="fas fa-info-circle mr-2 text-[#0057B8]"></i>System Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Version</span><span>1.0.0</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform</span><span>TBB OS</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Business</span><span>{settings.businessName}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
