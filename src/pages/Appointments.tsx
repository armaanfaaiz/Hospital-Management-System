import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Patient, Doctor, Department, InsertAppointment } from '../types/database';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';

export function Appointments() {
  const [appointments, setAppointments] = useState<
    (Appointment & { patient?: Patient; doctor?: Doctor; department?: Department })[]
  >([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<InsertAppointment>({
    patient_id: '',
    doctor_id: '',
    department_id: null,
    appointment_date: '',
    duration_minutes: 30,
    type: 'consultation',
    status: 'scheduled',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(*), department:departments(*)')
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
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

  const fetchDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*').order('name');
      if (data) setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : '';
    const doctorName = apt.doctor ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}` : '';
    return (
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: '',
      department_id: null,
      appointment_date: '',
      duration_minutes: 30,
      type: 'consultation',
      status: 'scheduled',
      notes: '',
    });
    setEditingAppointment(null);
    setError(null);
  };

  const openModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        department_id: appointment.department_id,
        appointment_date: appointment.appointment_date,
        duration_minutes: appointment.duration_minutes,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes || '',
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

    if (!formData.patient_id || !formData.doctor_id || !formData.appointment_date) {
      setError('Please select a patient, doctor, and appointment date');
      return;
    }

    try {
      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(formData)
          .eq('id', editingAppointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert([formData]);
        if (error) throw error;
      }

      closeModal();
      fetchAppointments();
    } catch (err) {
      setError('Failed to save appointment');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-slate-100 text-slate-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'no_show':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-cyan-100 text-cyan-700';
      case 'follow_up':
        return 'bg-indigo-100 text-indigo-700';
      case 'emergency':
        return 'bg-red-100 text-red-700';
      case 'routine':
        return 'bg-green-100 text-green-700';
      case 'surgery':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPastAppointment = (dateStr: string) => {
    return new Date(dateStr) < new Date();
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
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 mt-1">Schedule and manage patient appointments</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Schedule Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, doctor, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredAppointments.map((apt) => (
          <div
            key={apt.id}
            className={`bg-white rounded-xl border ${
              isPastAppointment(apt.appointment_date) ? 'border-slate-200' : 'border-blue-100'
            } hover:shadow-md transition-shadow overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isPastAppointment(apt.appointment_date) ? 'bg-slate-100' : 'bg-blue-100'
                    }`}
                  >
                    <Calendar
                      className={`w-6 h-6 ${
                        isPastAppointment(apt.appointment_date) ? 'text-slate-400' : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(apt.type)}`}
                      >
                        {apt.type.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </p>
                          {apt.patient?.phone && (
                            <p className="text-xs text-slate-500">{apt.patient.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{apt.doctor?.specialization}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-800">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(apt.appointment_date)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {formatTime(apt.appointment_date)} ({apt.duration_minutes} min)
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(apt)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {apt.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">{apt.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No appointments found</h3>
          <p className="text-slate-400 mt-1">Schedule your first appointment to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Patient *
                  </label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Doctor *
                  </label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department (optional)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Appointment Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Appointment Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as InsertAppointment['type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="routine">Routine Check-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="surgery">Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InsertAppointment['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any notes or special instructions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
