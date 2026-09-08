import { useState } from 'react';
import { useToast, useAuth } from '../App';
import { getCustomers, createCustomer, updateCustomer, getOrders, formatCurrency, formatDate, logActivity } from '../utils/storage';

export default function Customers() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [customers, setCustomers] = useState(getCustomers());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  const [form, setForm] = useState({ name: '', phone: '', facebookName: '', address: '', township: '', city: '', notes: '' });

  const filtered = customers.filter(c => {
    const s = search.toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.facebookName.toLowerCase().includes(s);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showToast('Customer name is required.', 'error'); return; }
    if (editId) {
      updateCustomer(editId, form);
      logActivity(user!.userId, 'Customer Updated', 'customer', editId, `Updated ${form.name}`);
      showToast('Customer updated.');
    } else {
      const c = createCustomer(form);
      logActivity(user!.userId, 'Customer Created', 'customer', c.id, `Created ${c.name}`);
      showToast('Customer created.');
    }
    setCustomers(getCustomers());
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', phone: '', facebookName: '', address: '', township: '', city: '', notes: '' });
  };

  const handleEdit = (c: any) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone, facebookName: c.facebookName, address: c.address, township: c.township, city: c.city, notes: c.notes });
    setShowForm(true);
  };

  const getCustomerOrders = (id: number) => getOrders().filter(o => o.customerId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const viewCustomer = viewId ? customers.find(c => c.id === viewId) : null;
  const viewOrders = viewId ? getCustomerOrders(viewId) : [];
  const totalSpent = viewOrders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', facebookName: '', address: '', township: '', city: '', notes: '' }); }} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
          <i className="fas fa-plus mr-2"></i>Add Customer
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search name, phone, Facebook..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Facebook</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Orders</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No customers found</td></tr>
            ) : filtered.map(c => {
              const orderCount = getCustomerOrders(c.id).length;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.facebookName}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{orderCount}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setViewId(c.id)} className="text-[#0057B8] hover:underline text-xs">View</button>
                    <button onClick={() => handleEdit(c)} className="text-gray-600 hover:underline text-xs">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View Customer Detail */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={() => setViewId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{viewCustomer.name}</h2>
              <button onClick={() => setViewId(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-gray-500">Phone:</span> {viewCustomer.phone}</p>
              <p><span className="text-gray-500">Facebook:</span> {viewCustomer.facebookName}</p>
              <p><span className="text-gray-500">Address:</span> {viewCustomer.address}</p>
              <p><span className="text-gray-500">Township:</span> {viewCustomer.township}</p>
              <p><span className="text-gray-500">City:</span> {viewCustomer.city}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium">{viewOrders.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-medium">{formatCurrency(totalSpent)}</span>
              </div>
              {viewOrders.length > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Last Order</span>
                  <span className="font-medium">{formatDate(viewOrders[0].orderDate)}</span>
                </div>
              )}
            </div>
            <h3 className="font-medium text-sm text-gray-700 mb-2">Order History</h3>
            <div className="space-y-2">
              {viewOrders.length === 0 ? <p className="text-sm text-gray-400">No orders yet</p> :
                viewOrders.map(o => (
                  <div key={o.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{o.voucherNumber}</span>
                      <span className="text-gray-500 ml-2">{formatDate(o.orderDate)}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(o.totalAmount)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Customer' : 'Add Customer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Facebook Name</label>
                  <input type="text" value={form.facebookName} onChange={e => setForm({...form, facebookName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Township</label>
                  <input type="text" value={form.township} onChange={e => setForm({...form, township: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-[#0057B8] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">{editId ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
