import { useState } from 'react';
import { useToast, useAuth } from '../App';
import { getBales, createBale, updateBale, getProducts, formatCurrency, formatDate, logActivity } from '../utils/storage';

export default function Bales() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [bales, setBales] = useState(getBales());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ purchaseDate: '', supplierName: '', baleCost: 0, expectedQty: 0, actualQty: 0, status: 'Purchased' as const, notes: '' });

  const filtered = bales.filter(b => {
    const matchSearch = !search || b.baleCode.toLowerCase().includes(search.toLowerCase()) || b.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.purchaseDate) { showToast('Please fill required fields.', 'error'); return; }
    if (editId) {
      updateBale(editId, form);
      logActivity(user!.userId, 'Bale Updated', 'bale', editId, `Updated bale ${editId}`);
      showToast('Bale updated successfully.');
    } else {
      const bale = createBale(form);
      logActivity(user!.userId, 'Bale Created', 'bale', bale.id, `Created bale ${bale.baleCode}`);
      showToast('Bale created successfully.');
    }
    setBales(getBales());
    setShowForm(false);
    setEditId(null);
    setForm({ purchaseDate: '', supplierName: '', baleCost: 0, expectedQty: 0, actualQty: 0, status: 'Purchased', notes: '' });
  };

  const handleEdit = (bale: any) => {
    setEditId(bale.id);
    setForm({ purchaseDate: bale.purchaseDate, supplierName: bale.supplierName, baleCost: bale.baleCost, expectedQty: bale.expectedQty, actualQty: bale.actualQty, status: bale.status, notes: bale.notes });
    setShowForm(true);
  };

  const handleStatusChange = (id: number, status: any) => {
    updateBale(id, { status });
    logActivity(user!.userId, 'Bale Updated', 'bale', id, `Status changed to ${status}`);
    setBales(getBales());
    showToast('Status updated.');
  };

  const getBaleProducts = (baleId: number) => getProducts().filter(p => p.baleId === baleId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bales</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ purchaseDate: new Date().toISOString().slice(0,10), supplierName: '', baleCost: 0, expectedQty: 0, actualQty: 0, status: 'Purchased', notes: '' }); }} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
          <i className="fas fa-plus mr-2"></i>New Bale
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search bale code or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="Purchased">Purchased</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Bale Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Products</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No bales found</td></tr>
            ) : filtered.map(b => {
              const prods = getBaleProducts(b.id);
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.baleCode}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(b.purchaseDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{b.supplierName}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(b.baleCost)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{prods.length}/{b.actualQty || b.expectedQty}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={b.status} onChange={e => handleStatusChange(b.id, e.target.value)} className="text-xs px-2 py-1 border rounded bg-white">
                      <option value="Purchased">Purchased</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(b)} className="text-[#0057B8] hover:underline text-xs mr-2">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Bale' : 'New Bale'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date *</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Name *</label>
                  <input type="text" value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bale Cost (MMK)</label>
                  <input type="number" value={form.baleCost} onChange={e => setForm({...form, baleCost: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Qty</label>
                  <input type="number" value={form.expectedQty} onChange={e => setForm({...form, expectedQty: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Actual Qty</label>
                  <input type="number" value={form.actualQty} onChange={e => setForm({...form, actualQty: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
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
