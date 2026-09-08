import { useState } from 'react';
import { useToast, useAuth } from '../App';
import { getExpenses, createExpense, getOrders, getProducts, formatCurrency, formatDate, logActivity } from '../utils/storage';

export default function Finance() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState(getExpenses());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ expenseDate: new Date().toISOString().slice(0, 10), category: '', amount: 0, description: '', reference: '' });

  const orders = getOrders().filter(o => o.orderStatus !== 'Cancelled');
  const products = getProducts();
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalProductCost = orders.reduce((s, o) =>
    s + o.items.reduce((is, i) => {
      const product = products.find(p => p.id === i.productId);
      return is + (product?.costPrice || 0) * i.quantity;
    }, 0), 0);
  const grossProfit = totalRevenue - totalProductCost;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount) { showToast('Please fill required fields.', 'error'); return; }
    const exp = createExpense(form);
    logActivity(user!.userId, 'Expense Created', 'expense', exp.id, `Expense: ${form.category} - ${formatCurrency(form.amount)}`);
    showToast('Expense added.');
    setExpenses(getExpenses());
    setShowForm(false);
    setForm({ expenseDate: new Date().toISOString().slice(0, 10), category: '', amount: 0, description: '', reference: '' });
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <button onClick={() => setShowForm(true)} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
          <i className="fas fa-plus mr-2"></i>Add Expense
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Product Cost</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(totalProductCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Gross Profit</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(grossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Gross Profit - Expenses</p>
            <p>{formatCurrency(grossProfit)} - {formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Expenses</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Description</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedExpenses.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No expenses recorded</td></tr>
            ) : sortedExpenses.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{formatDate(e.expenseDate)}</td>
                <td className="px-4 py-3 text-gray-900">{e.category}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{e.description}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm({...form, expenseDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                  <option value="">Select...</option>
                  <option value="Bale Purchase">Bale Purchase</option>
                  <option value="Delivery Cost">Delivery Cost</option>
                  <option value="Packaging Cost">Packaging Cost</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (MMK) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
                <input type="text" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-[#0057B8] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">Add Expense</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
