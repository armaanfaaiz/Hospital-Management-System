import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Patient, Doctor, Appointment, Room, Department } from '../types/database';
import {
  Users,
  Stethoscope,
  Calendar,
  DoorOpen,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  occupiedRooms: number;
  totalRooms: number;
  activeAdmissions: number;
  todayAppointments: number;
  departments: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    activeAdmissions: 0,
    todayAppointments: 0,
    departments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<(Appointment & { patient: Patient; doctor: Doctor })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, roomsRes, admissionsRes, deptsRes, recentAppts] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact' }),
        supabase.from('doctors').select('id', { count: 'exact' }),
        supabase.from('appointments').select('id', { count: 'exact' }),
        supabase.from('rooms').select('id, status', { count: 'exact' }),
        supabase.from('admissions').select('id', { count: 'exact' }).eq('status', 'admitted'),
        supabase.from('departments').select('id', { count: 'exact' }),
        supabase
          .from('appointments')
          .select('*, patient:patients(*), doctor:doctors(*)')
          .order('appointment_date', { ascending: true })
          .limit(5),
      ]);

      const occupiedRooms = roomsRes.data?.filter((r) => r.status === 'occupied').length || 0;
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .gte('appointment_date', today)
        .lt('appointment_date', today + 'T23:59:59');

      setStats({
        totalPatients: patientsRes.count || 0,
        totalDoctors: doctorsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
        occupiedRooms,
        totalRooms: roomsRes.count || 0,
        activeAdmissions: admissionsRes.count || 0,
        todayAppointments: todayCount || 0,
        departments: deptsRes.count || 0,
      });

      setRecentAppointments(recentAppts.data as (Appointment & { patient: Patient; doctor: Doctor })[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Active Doctors',
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Occupied Rooms',
      value: `${stats.occupiedRooms}/${stats.totalRooms}`,
      icon: DoorOpen,
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      default:
        return 'bg-slate-100 text-slate-700';
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              <p className="text-slate-500 mt-1">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5" />
            <h3 className="font-medium">Active Admissions</h3>
          </div>
          <p className="text-4xl font-bold">{stats.activeAdmissions}</p>
          <p className="text-slate-400 mt-2">patients currently admitted</p>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5" />
            <h3 className="font-medium">Room Availability</h3>
          </div>
          <p className="text-4xl font-bold">
            {stats.totalRooms > 0
              ? Math.round(((stats.totalRooms - stats.occupiedRooms) / stats.totalRooms) * 100)
              : 0}
            %
          </p>
          <p className="text-slate-400 mt-2">{stats.totalRooms - stats.occupiedRooms} rooms available</p>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-medium">Departments</h3>
          </div>
          <p className="text-4xl font-bold">{stats.departments}</p>
          <p className="text-slate-400 mt-2">active departments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          {recentAppointments.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {apt.patient?.first_name?.charAt(0)}
                            {apt.patient?.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-slate-800">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-slate-600">
                        Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                      </p>
                      <p className="text-slate-400 text-sm">{apt.doctor?.specialization}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatDate(apt.appointment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 capitalize">
                        {apt.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No appointments scheduled yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
