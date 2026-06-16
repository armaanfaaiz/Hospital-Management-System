# MediCare Hospital Management System

A comprehensive hospital management system with separate Admin and Patient portals, built with React, TypeScript, and PostgreSQL (Supabase).

## Features

### Admin Portal
- **Dashboard** - Overview statistics and analytics
- **Patient Management** - Add, edit, view, and manage patient records
- **Doctor Management** - Manage medical staff and their departments
- **Appointments** - Schedule and track patient appointments
- **Prescriptions** - Create and manage patient prescriptions
- **Billing** - Create invoices, manage payments, track billing
- **Departments** - Organize hospital departments
- **Rooms** - Manage hospital rooms and bed occupancy
- **Medical Records** - Patient visit history and diagnoses

### Patient Portal
- **Dashboard** - Personal health overview
- **Appointments** - View upcoming appointments
- **Prescriptions** - View prescribed medications
- **Medical Records** - Access visit history
- **Bills** - View and pay outstanding bills

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with role-based access
- **Icons**: Lucide React
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- Git (optional)

## Setup Instructions

### 1. Clone or Download the Project

If you have the project files, copy them to your local machine maintaining the directory structure, or:

```bash
# If using git
git clone <your-repo-url>
cd hospital-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)
4. Go to Project Settings > API to get your credentials

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:
- Supabase Dashboard > Project Settings > API
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon public key

### 5. Run Database Migrations

Run the following SQL in the Supabase SQL Editor (one at a time):

**Migration 1: Core Schema**
```sql
-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_doctor_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors/Staff table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialization TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  license_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments 
ADD CONSTRAINT fk_head_doctor FOREIGN KEY (head_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  blood_type TEXT,
  insurance_number TEXT,
  status TEXT DEFAULT 'outpatient' CHECK (status IN ('outpatient', 'admitted', 'discharged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT UNIQUE NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('general', 'private', 'icu', 'operating', 'emergency')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 1,
  current_occupancy INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  floor INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admissions table
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  admission_date TIMESTAMPTZ DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'follow_up', 'emergency', 'routine', 'surgery')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  treatment TEXT,
  prescription TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_departments" ON departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_departments" ON departments FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_doctors" ON doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_doctors" ON doctors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_doctors" ON doctors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_doctors" ON doctors FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_patients" ON patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_patients" ON patients FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_rooms" ON rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_rooms" ON rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_rooms" ON rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_rooms" ON rooms FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_admissions" ON admissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_admissions" ON admissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_admissions" ON admissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_admissions" ON admissions FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_appointments" ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_appointments" ON appointments FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_medical_records" ON medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_medical_records" ON medical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_medical_records" ON medical_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_medical_records" ON medical_records FOR DELETE TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_doctors_department ON doctors(department_id);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_rooms_department ON rooms(department_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_room ON admissions(room_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_date ON medical_records(visit_date);
```

**Migration 2: Admin & Billing Schema**
```sql
-- User profiles table for role management
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'patient')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table for patient billing
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  bill_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill items table for individual charges
CREATE TABLE bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'medication', 'consultation', 'procedure', 'room', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "select_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_profiles" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_profiles" ON profiles FOR DELETE TO authenticated USING (true);

-- RLS Policies for bills
CREATE POLICY "select_bills" ON bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bills" ON bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_bills" ON bills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bills" ON bills FOR DELETE TO authenticated USING (true);

-- RLS Policies for bill_items
CREATE POLICY "select_bill_items" ON bill_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bill_items" ON bill_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_bill_items" ON bill_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bill_items" ON bill_items FOR DELETE TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Create Admin Account

1. Start the app and sign up with your email
2. Go to Supabase SQL Editor and run:

```sql
-- Replace with your user ID from auth.users table
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or find your user ID first:
```sql
SELECT id, email FROM auth.users;
```

Then set as admin:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'your-user-uuid';
```

### 7. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 8. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx          # Login/signup portal selection
│   └── Layout.tsx        # Dashboard layout with navigation
├── hooks/
│   └── useAuth.tsx       # Authentication context and hooks
├── lib/
│   └── supabase.ts       # Supabase client configuration
├── pages/
│   ├── Dashboard.tsx     # Admin dashboard
│   ├── PatientDashboard.tsx  # Patient portal dashboard
│   ├── Patients.tsx      # Patient management
│   ├── Doctors.tsx       # Doctor management
│   ├── Appointments.tsx  # Appointment scheduling
│   ├── Prescriptions.tsx # Prescription management
│   ├── Bills.tsx         # Billing management
│   ├── Departments.tsx   # Department management
│   ├── Rooms.tsx         # Room/bed management
│   └── MedicalRecords.tsx # Medical records
├── types/
│   └── database.ts       # TypeScript types for database
├── App.tsx               # Main app component
└── main.tsx              # Entry point
```

## User Roles

- **Admin**: Full access to all features
- **Doctor**: Can view and manage their patients, appointments, prescriptions
- **Patient**: Access to personal dashboard, appointments, records, and bills

## Troubleshooting

### "Missing Supabase environment variables"
Make sure your `.env` file exists and has the correct values from your Supabase project.

### "Invalid email or password"
- Ensure email confirmation is disabled in Supabase Dashboard > Authentication > Providers
- Or check your email for the confirmation link

### Tables not created
Run the migration SQL in Supabase SQL Editor. Copy each migration block and run them sequentially.

### Can't access admin features
Make sure your profile has `role = 'admin'` in the profiles table.

## License

MIT
