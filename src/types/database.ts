export interface Profile {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'patient';
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_doctor_id: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialization: string;
  department_id: string | null;
  license_number: string;
  status: 'active' | 'on_leave' | 'inactive';
  hire_date: string;
  created_at: string;
  department?: Department;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | null;
  email: string | null;
  phone: string;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  blood_type: string | null;
  insurance_number: string | null;
  status: 'outpatient' | 'admitted' | 'discharged';
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  room_type: 'general' | 'private' | 'icu' | 'operating' | 'emergency';
  department_id: string | null;
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  floor: number | null;
  created_at: string;
  department?: Department;
}

export interface Admission {
  id: string;
  patient_id: string;
  room_id: string | null;
  doctor_id: string | null;
  admission_date: string;
  discharge_date: string | null;
  reason: string;
  status: 'admitted' | 'discharged' | 'transferred';
  notes: string | null;
  created_at: string;
  patient?: Patient;
  room?: Room;
  doctor?: Doctor;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string | null;
  appointment_date: string;
  duration_minutes: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine' | 'surgery';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  visit_date: string;
  diagnosis: string;
  symptoms: string | null;
  treatment: string | null;
  prescription: string | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Bill {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  bill_date: string;
  due_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
  items?: BillItem[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'service' | 'medication' | 'consultation' | 'procedure' | 'room' | 'other';
  created_at: string;
}

export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type InsertDepartment = Omit<Department, 'id' | 'created_at' | 'head_doctor_id'> & { head_doctor_id?: string };
export type InsertDoctor = Omit<Doctor, 'id' | 'created_at'>;
export type InsertPatient = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;
export type InsertRoom = Omit<Room, 'id' | 'created_at'>;
export type InsertAdmission = Omit<Admission, 'id' | 'created_at'>;
export type InsertAppointment = Omit<Appointment, 'id' | 'created_at'>;
export type InsertMedicalRecord = Omit<MedicalRecord, 'id' | 'created_at'>;
export type InsertBill = Omit<Bill, 'id' | 'created_at' | 'updated_at'>;
export type InsertBillItem = Omit<BillItem, 'id' | 'created_at'>;
