import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MedicalRecord, Patient, Doctor, InsertMedicalRecord } from '../types/database';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Pill,
  User,
  Stethoscope,
  Calendar,
  FileText,
} from 'lucide-react';

export function Prescriptions() {
  const [records, setRecords] = useState<(MedicalRecord & { patient?: Patient; doctor?: Doctor })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<MedicalRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<InsertMedicalRecord>({
    patient_id: '',
    doctor_id: null,
    visit_date: new Date().toISOString(),
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: '',
    follow_up_date: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:patients(*), doctor:doctors(*)')
        .not('prescription', 'is', null)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
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

  const filteredRecords = records.filter((record) => {
    const patientName = record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '';
    return (
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.prescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: null,
      visit_date: new Date().toISOString(),
      diagnosis: '',
      symptoms: '',
      treatment: '',
      prescription: '',
      notes: '',
      follow_up_date: null,
    });
    setEditingRecord(null);
    setError(null);
  };

  const openModal = (record?: MedicalRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        patient_id: record.patient_id,
        doctor_id: record.doctor_id,
        visit_date: record.visit_date,
        diagnosis: record.diagnosis,
        symptoms: record.symptoms || '',
        treatment: record.treatment || '',
        prescription: record.prescription || '',
        notes: record.notes || '',
        follow_up_date: record.follow_up_date,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.patient_id || !formData.prescription) {
      setError('Please select a patient and enter a prescription');
      return;
    }

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from('medical_records')
          .update(formData)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medical_records').insert([formData]);
        if (error) throw error;
      }

      closeModal();
      fetchRecords();
    } catch (err) {
      setError('Failed to save prescription');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      const { error } = await supabase.from('medical_records').delete().eq('id', id);
      if (error) throw error;
      fetchRecords();
    } catch (err) {
      console.error('Error deleting prescription:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-slate-500 mt-1">Manage patient prescriptions</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, diagnosis, or medication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200">
                    <Pill className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{record.diagnosis}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {record.patient?.first_name} {record.patient?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">Patient</p>
                        </div>
                      </div>
                      {record.doctor && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Dr. {record.doctor.first_name} {record.doctor.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{record.doctor.specialization}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">Prescription</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.prescription}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(record.visit_date)}
                      </div>
                      {record.follow_up_date && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <FileText className="w-4 h-4" />
                          Follow-up: {formatDate(record.follow_up_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(record)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No prescriptions found</h3>
          <p className="text-slate-400 mt-1">Create your first prescription to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingRecord ? 'Edit Prescription' : 'New Prescription'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Doctor</label>
                  <select
                    value={formData.doctor_id || ''}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} - {d.specialization}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={formData.visit_date.split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.follow_up_date || ''}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Diagnosis..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prescription *</label>
                <textarea
                  value={formData.prescription || ''}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                  rows={5}
                  placeholder="Medications, dosage, instructions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                  {editingRecord ? 'Update' : 'Create'} Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
