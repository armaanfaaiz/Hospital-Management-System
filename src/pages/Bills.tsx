import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bill, BillItem, Patient, Doctor, InsertBill, InsertBillItem } from '../types/database';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Receipt,
  User,
  Stethoscope,
  Calendar,
  DollarSign,
  Eye,
  Printer,
} from 'lucide-react';

export function Bills() {
  const [bills, setBills] = useState<(Bill & { patient?: Patient; doctor?: Doctor; items?: BillItem[] })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState<InsertBill>({
    patient_id: '',
    doctor_id: null,
    appointment_id: null,
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'pending',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: '',
  });
  const [billItems, setBillItems] = useState<InsertBillItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*, patient:patients(*), doctor:doctors(*), items:bill_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await supabase.from('patients').select('*').order('first_name');
      if (data) setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await supabase.from('doctors').select('*').eq('status', 'active').order('first_name');
      if (data) setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const patientName = bill.patient ? `${bill.patient.first_name} ${bill.patient.last_name}` : '';
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) || bill.id.slice(0, 8).includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: null,
      appointment_id: null,
      bill_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pending',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: '',
    });
    setBillItems([]);
    setEditingBill(null);
    setError(null);
  };

  const openModal = (bill?: Bill) => {
    if (bill) {
      setEditingBill(bill);
      setFormData({
        patient_id: bill.patient_id,
        doctor_id: bill.doctor_id,
        appointment_id: bill.appointment_id,
        bill_date: bill.bill_date,
        due_date: bill.due_date || '',
        status: bill.status,
        subtotal: bill.subtotal,
        tax: bill.tax,
        discount: bill.discount,
        total: bill.total,
        notes: bill.notes || '',
      });
      if (bill.items) {
        setBillItems(bill.items.map(item => ({
          bill_id: bill.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          item_type: item.item_type,
        })));
      }
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addItem = () => {
    setBillItems([
      ...billItems,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        item_type: 'service',
      } as InsertBillItem,
    ]);
  };

  const updateItem = (index: number, field: keyof InsertBillItem, value: any) => {
    const updated = [...billItems];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total_price = (updated[index].quantity || 0) * (updated[index].unit_price || 0);
    }
    setBillItems(updated);
    calculateTotals(updated);
  };

  const removeItem = (index: number) => {
    const updated = billItems.filter((_, i) => i !== index);
    setBillItems(updated);
    calculateTotals(updated);
  };

  const calculateTotals = (items: InsertBillItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - (formData.discount || 0);
    setFormData({ ...formData, subtotal, tax, total });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.patient_id || billItems.length === 0) {
      setError('Please select a patient and add at least one item');
      return;
    }

    try {
      let billId = editingBill?.id;

      if (editingBill) {
        const { error } = await supabase.from('bills').update(formData).eq('id', editingBill.id);
        if (error) throw error;

        // Delete existing items and insert new ones
        await supabase.from('bill_items').delete().eq('bill_id', editingBill.id);
      } else {
        const { data, error } = await supabase.from('bills').insert([formData]).select();
        if (error) throw error;
        billId = data?.[0]?.id;
      }

      if (billId && billItems.length > 0) {
        const itemsWithBillId = billItems.map(item => ({ ...item, bill_id: billId }));
        const { error } = await supabase.from('bill_items').insert(itemsWithBillId);
        if (error) throw error;
      }

      closeModal();
      fetchBills();
    } catch (err) {
      setError('Failed to save bill');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
    }
  };

  const updateBillStatus = async (id: string, status: Bill['status']) => {
    try {
      const { error } = await supabase.from('bills').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error updating bill status:', err);
    }
  };

  const viewBill = (bill: Bill) => {
    setViewingBill(bill);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing Management</h1>
          <p className="text-slate-500 mt-1">Create and manage patient bills</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Bill
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or bill ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bill ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    #{bill.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="text-sm text-slate-700">
                        {bill.patient?.first_name} {bill.patient?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {bill.doctor ? `Dr. ${bill.doctor.first_name} ${bill.doctor.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(bill.bill_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 text-right">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => viewBill(bill)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(bill)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(bill.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBills.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p>No bills found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingBill ? 'Edit Bill' : 'Create New Bill'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                  <select
                    value={formData.doctor_id || ''}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select doctor (optional)</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={formData.bill_date}
                    onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">Bill Items</label>
                  <button type="button" onClick={addItem} className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-20">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-24">Total</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-20">Type</th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium">{formatCurrency(item.total_price || 0)}</td>
                          <td className="px-3 py-2">
                            <select
                              value={item.item_type}
                              onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-sm"
                            >
                              <option value="service">Service</option>
                              <option value="medication">Medication</option>
                              <option value="consultation">Consultation</option>
                              <option value="procedure">Procedure</option>
                              <option value="room">Room</option>
                              <option value="other">Other</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Subtotal</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(formData.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tax (10%)</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(formData.tax)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Discount</p>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, discount, total: formData.subtotal + formData.tax - discount });
                    }}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(formData.total)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InsertBill['status'] })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  {editingBill ? 'Update Bill' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Bill #{viewingBill.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">Created: {new Date(viewingBill.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Patient</p>
                    <p className="font-medium text-slate-800">
                      {viewingBill.patient?.first_name} {viewingBill.patient?.last_name}
                    </p>
                  </div>
                </div>
                {viewingBill.doctor && (
                  <div className="flex items-start gap-3">
                    <Stethoscope className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Doctor</p>
                      <p className="font-medium text-slate-800">
                        Dr. {viewingBill.doctor.first_name} {viewingBill.doctor.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingBill.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-slate-700">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-800 text-right">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700">{formatCurrency(viewingBill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-700">{formatCurrency(viewingBill.tax)}</span>
                  </div>
                  {viewingBill.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="text-green-600">-{formatCurrency(viewingBill.discount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(viewingBill.total)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Status:</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewingBill.status)}`}>
                  {viewingBill.status}
                </span>
              </div>

              {viewingBill.status !== 'paid' && (
                <button
                  onClick={() => {
                    updateBillStatus(viewingBill.id, 'paid');
                    setShowViewModal(false);
                  }}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
