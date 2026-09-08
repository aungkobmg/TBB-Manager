import { useState } from 'react';
import { useToast, useAuth } from '../App';
import { getProducts, createProduct, updateProduct, getBales, formatCurrency, formatDate, logActivity } from '../utils/storage';

export default function Inventory() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState(getProducts());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const bales = getBales();

  const [form, setForm] = useState({
    productName: '', brand: '', category: '', size: '', color: '',
    condition: 'A' as 'A+' | 'A' | 'B', costPrice: 0, sellingPrice: 0,
    baleId: null as number | null, status: 'Available' as const
  });

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = !s || p.productCode.toLowerCase().includes(s) || p.productName.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s) || p.size.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchCondition = !filterCondition || p.condition === filterCondition;
    return matchSearch && matchStatus && matchCondition;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName) { showToast('Product name is required.', 'error'); return; }
    if (editId) {
      updateProduct(editId, form);
      logActivity(user!.userId, 'Product Updated', 'product', editId, `Updated ${form.productName}`);
      showToast('Product updated.');
    } else {
      const p = createProduct(form);
      logActivity(user!.userId, 'Product Created', 'product', p.id, `Created ${p.productCode}`);
      showToast(`Product created: ${p.productCode}`);
    }
    setProducts(getProducts());
    setShowForm(false);
    setEditId(null);
    resetForm();
  };

  const resetForm = () => setForm({ productName: '', brand: '', category: '', size: '', color: '', condition: 'A', costPrice: 0, sellingPrice: 0, baleId: null, status: 'Available' });

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({ productName: p.productName, brand: p.brand, category: p.category, size: p.size, color: p.color, condition: p.condition, costPrice: p.costPrice, sellingPrice: p.sellingPrice, baleId: p.baleId, status: p.status });
    setShowForm(true);
  };

  const statusColors: Record<string, string> = {
    Available: 'bg-green-100 text-green-700',
    Reserved: 'bg-yellow-100 text-yellow-700',
    Sold: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); resetForm(); }} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
          <i className="fas fa-plus mr-2"></i>Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{products.filter(p => p.status === 'Available').length}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{products.filter(p => p.status === 'Sold').length}</p>
          <p className="text-xs text-gray-500">Sold</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{products.filter(p => p.status === 'Reserved').length}</p>
          <p className="text-xs text-gray-500">Reserved</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search code, name, brand, size..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Sold">Sold</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Condition</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Brand</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Size</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Cond</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Sell Price</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No products found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-[#0057B8]">{p.productCode}</td>
                <td className="px-4 py-3 text-gray-900">{p.productName}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.brand}</td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.size}</td>
                <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{p.condition}</span></td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.sellingPrice)}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[p.status]}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(p)} className="text-[#0057B8] hover:underline text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input type="text" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                  <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                  <input type="text" value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (MMK)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (MMK)</label>
                  <input type="number" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source Bale</label>
                <select value={form.baleId || ''} onChange={e => setForm({...form, baleId: e.target.value ? +e.target.value : null})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">None</option>
                  {bales.map(b => <option key={b.id} value={b.id}>{b.baleCode} - {b.supplierName}</option>)}
                </select>
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
