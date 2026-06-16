import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Patient, Appointment, MedicalRecord, Bill } from '../types/database';
import {
  Calendar,
  FileText,
  Receipt,
  Pill,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';

export function PatientDashboard() {
  const { user, profile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<(Appointment & { doctor?: any })[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      // Find patient by email
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('email', user?.email)
        .single();

      if (patientData) {
        setPatient(patientData);

        const [appointmentsRes, recordsRes, billsRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('*, doctor:doctors(*)')
            .eq('patient_id', patientData.id)
            .order('appointment_date', { ascending: true }),
          supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientData.id)
            .order('visit_date', { ascending: false }),
          supabase
            .from('bills')
            .select('*')
            .eq('patient_id', patientData.id)
            .order('created_at', { ascending: false }),
        ]);

        setAppointments(appointmentsRes.data || []);
        setRecords(recordsRes.data || []);
        setBills(billsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) > new Date() && a.status !== 'cancelled'
  );

  const pendingBills = bills.filter((b) => b.status === 'pending');
  const totalDue = pendingBills.reduce((sum, b) => sum + b.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-medium text-amber-800">No patient record found</h3>
            <p className="text-sm text-amber-700">Please contact reception to link your account</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {patient.first_name}!</h1>
        <p className="text-blue-100 mt-1">Your health information at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-slate-500 text-sm">Upcoming Appointments</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{upcomingAppointments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Pill className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-slate-500 text-sm">Active Prescriptions</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {records.filter((r) => r.prescription).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Receipt className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-slate-500 text-sm">Amount Due</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">${totalDue.toFixed(2)}</p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
        </div>
        <div className="p-6">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">
                      Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_date)}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                    {apt.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </div>

      {/* Recent Medical Records */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Recent Medical Records</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {records.slice(0, 3).map((record) => (
            <div key={record.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-slate-100">
                  <Activity className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800">{record.diagnosis}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDate(record.visit_date)}
                  </p>
                  {record.prescription && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <p className="text-xs font-medium text-emerald-700">Prescription</p>
                      <p className="text-sm text-slate-600 line-clamp-1">{record.prescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-slate-500 text-center py-6">No medical records yet</p>
          )}
        </div>
      </div>

      {/* Pending Bills */}
      {pendingBills.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200">
          <div className="p-6 border-b border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-amber-800">Pending Payments</h2>
              </div>
              <span className="text-xl font-bold text-amber-700">${totalDue.toFixed(2)}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingBills.map((bill) => (
              <div key={bill.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Bill #{bill.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{formatDate(bill.bill_date)}</p>
                </div>
                <span className="text-lg font-semibold text-amber-600">${bill.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
