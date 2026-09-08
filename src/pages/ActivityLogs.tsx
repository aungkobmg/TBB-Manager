import { useState } from 'react';
import { getActivityLogs, formatDate, formatDateTime } from '../utils/storage';

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const logs = getActivityLogs().filter(l => {
    const s = search.toLowerCase();
    const matchSearch = !s || l.action.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.entityType.toLowerCase().includes(s);
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const actions = [...new Set(getActivityLogs().map(l => l.action))];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none" />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No activity logs</td></tr>
            ) : logs.slice(0, 100).map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    l.action.includes('Created') ? 'bg-green-100 text-green-700' :
                    l.action.includes('Updated') ? 'bg-blue-100 text-blue-700' :
                    l.action.includes('Cancelled') ? 'bg-red-100 text-red-700' :
                    l.action.includes('Login') || l.action.includes('Logout') ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{l.action}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{l.entityType}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length > 100 && <p className="text-sm text-gray-400 mt-2 text-center">Showing latest 100 of {logs.length} logs</p>}
    </div>
  );
}
