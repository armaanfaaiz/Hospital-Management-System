import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Room, Department, InsertRoom } from '../types/database';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  DoorOpen,
  Building2,
  Layers,
} from 'lucide-react';

export function Rooms() {
  const [rooms, setRooms] = useState<(Room & { department?: Department })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<InsertRoom>({
    room_number: '',
    room_type: 'general',
    department_id: null,
    capacity: 1,
    current_occupancy: 0,
    status: 'available',
    floor: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    fetchDepartments();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, department:departments(*)')
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
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

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.department?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesType = filterType === 'all' || room.room_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'general',
      department_id: null,
      capacity: 1,
      current_occupancy: 0,
      status: 'available',
      floor: null,
    });
    setEditingRoom(null);
    setError(null);
  };

  const openModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_number: room.room_number,
        room_type: room.room_type,
        department_id: room.department_id,
        capacity: room.capacity,
        current_occupancy: room.current_occupancy,
        status: room.status,
        floor: room.floor,
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

    if (!formData.room_number) {
      setError('Please enter a room number');
      return;
    }

    try {
      if (editingRoom) {
        const { error } = await supabase.from('rooms').update(formData).eq('id', editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rooms').insert([formData]);
        if (error) throw error;
      }

      closeModal();
      fetchRooms();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('Room number already exists');
      } else {
        setError('Failed to save room');
      }
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
      fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'icu':
        return 'bg-rose-100 text-rose-600';
      case 'private':
        return 'bg-emerald-100 text-emerald-600';
      case 'operating':
        return 'bg-amber-100 text-amber-600';
      case 'emergency':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const capacityPercentage = (room: Room) => {
    if (room.capacity === 0) return 0;
    return Math.round((room.current_occupancy / room.capacity) * 100);
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
          <h1 className="text-2xl font-bold text-slate-800">Rooms & Beds</h1>
          <p className="text-slate-500 mt-1">Manage hospital rooms and bed capacity</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by room number or department..."
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
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="private">Private</option>
            <option value="icu">ICU</option>
            <option value="operating">Operating</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-slate-500 text-sm">Total Rooms</p>
          <p className="text-2xl font-bold text-slate-800">{rooms.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-slate-500 text-sm">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {rooms.filter((r) => r.status === 'available').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-slate-500 text-sm">Occupied</p>
          <p className="text-2xl font-bold text-red-600">
            {rooms.filter((r) => r.status === 'occupied').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-slate-500 text-sm">Maintenance</p>
          <p className="text-2xl font-bold text-amber-600">
            {rooms.filter((r) => r.status === 'maintenance').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className={`bg-white rounded-xl border ${getStatusColor(room.status)} hover:shadow-md transition-shadow overflow-hidden`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${getTypeIcon(room.room_type)} flex items-center justify-center`}
                  >
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{room.room_number}</h3>
                    <p className="text-xs text-slate-500 capitalize">{room.room_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(room)}
                    className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Occupancy</span>
                  <span className="font-medium text-slate-700">
                    {room.current_occupancy}/{room.capacity}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityPercentage(room) >= 100
                        ? 'bg-red-500'
                        : capacityPercentage(room) >= 50
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(capacityPercentage(room), 100)}%` }}
                  />
                </div>

                {room.department && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {room.department.name}
                  </div>
                )}
                {room.floor !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Layers className="w-3.5 h-3.5" />
                    Floor {room.floor}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`px-4 py-2 text-xs font-medium text-center capitalize ${
                room.status === 'available'
                  ? 'bg-green-50 text-green-700'
                  : room.status === 'occupied'
                  ? 'bg-red-50 text-red-700'
                  : room.status === 'maintenance'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {room.status}
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No rooms found</h3>
          <p className="text-slate-400 mt-1">Add your first room to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="e.g., A101, ICU-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Room Type *
                  </label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value as InsertRoom['room_type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="private">Private</option>
                    <option value="icu">ICU</option>
                    <option value="operating">Operating</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.floor ?? ''}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InsertRoom['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Occupancy
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.capacity}
                    value={formData.current_occupancy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_occupancy: Math.min(parseInt(e.target.value) || 0, formData.capacity),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
