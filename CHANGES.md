# Hospital Management System - Changes Documentation

## Overview
This document outlines all changes made to remove patient and doctor login functionality while keeping only admin login, and populate the database with dummy data for querying.

---

## 🔐 Authentication Changes

### 1. **Removed Login Options**
   - ❌ Patient login portal removed
   - ❌ Doctor login portal removed
   - ✅ Admin login portal only

### 2. **Updated Files**

#### `src/components/Auth.tsx`
- Removed "Select Portal" mode
- Removed patient and doctor login options
- Removed role selection during registration (now defaults to 'admin')
- Simplified auth flow to show only admin login and admin registration

#### `src/hooks/useAuth.tsx`
- Updated `signUp` function to only allow 'admin' role
- Returns error if any other role is attempted

#### `server.mjs`
- Updated `/api/auth/signup` endpoint to only accept 'admin' role
- Rejects signup with roles 'patient' or 'doctor'

---

## 📊 Database Seed Data

### Populated Tables with Dummy Data

#### **Departments (5 records)**
- Cardiology
- Neurology
- Orthopedics
- Pediatrics
- Emergency

#### **Doctors (6 records)**
- Dr. Rajesh Kumar - Cardiology
- Dr. Priya Sharma - Neurology
- Dr. Arjun Singh - Orthopedics
- Dr. Meera Patel - Pediatrics
- Dr. Vikram Verma - Emergency Medicine
- Dr. Anjali Gupta - Cardiology

#### **Patients (8 records)**
- Arun Malhotra (outpatient)
- Neha Reddy (admitted)
- Suresh Iyer (outpatient)
- Divya Nair (admitted)
- Amit Chopra (outpatient)
- Seema Singh (outpatient)
- Rohit Kumar (admitted)
- Pooja Desai (discharged)

#### **Rooms (10 records)**
- General, Private, ICU, Operating, Emergency room types
- Distributed across departments
- Status tracking (available, occupied, maintenance)

#### **Appointments (8 records)**
- Scheduled, confirmed, and completed appointments
- Linked to patients, doctors, and departments

#### **Medical Records (5 records)**
- Patient visit history
- Diagnoses, symptoms, treatments
- Medication details

#### **Bills (5 records)**
- Various billing statuses (pending, paid, overdue)
- Bill items (consultation, procedures, medications, room charges)
- Tax and discount calculations

#### **Admissions (4 records)**
- Patient room assignments
- Admission and discharge tracking

---

## 🚀 How to Seed the Database

### Option 1: Using npm script
```bash
npm run seed
```

### Option 2: Direct Node execution
```bash
node scripts/seed-db.mjs
```

This will:
1. Read the `.env` file for database credentials
2. Connect to the PostgreSQL database
3. Execute all insert statements from the seed migration
4. Display statistics and example queries

---

## 📝 Example Queries

The seed script provides example queries for common use cases:

### Get all patients with their status
```sql
SELECT id, first_name, last_name, status, created_at 
FROM patients 
ORDER BY created_at DESC;
```

### Get all active doctors by department
```sql
SELECT d.first_name, d.last_name, d.specialization, dept.name 
FROM doctors d
LEFT JOIN departments dept ON d.department_id = dept.id 
WHERE d.status = 'active';
```

### Get bill summary by status
```sql
SELECT status, COUNT(*) as count, SUM(total) as total_amount 
FROM bills 
GROUP BY status;
```

### Get occupied rooms
```sql
SELECT room_number, room_type, current_occupancy, capacity, status 
FROM rooms 
WHERE status = 'occupied';
```

### Get upcoming appointments
```sql
SELECT a.appointment_date, p.first_name as patient, d.first_name as doctor,
       a.type, dept.name 
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN departments dept ON a.department_id = dept.id
WHERE a.appointment_date > NOW() 
ORDER BY a.appointment_date ASC;
```

### Get patient medical history
```sql
SELECT mr.visit_date, mr.diagnosis, mr.treatment, d.first_name as doctor 
FROM medical_records mr
JOIN doctors d ON mr.doctor_id = d.id
WHERE mr.patient_id = '550e8400-e29b-41d4-a716-446655440201' 
ORDER BY mr.visit_date DESC;
```

---

## 🔄 Data Relationships & Synchronization

The seed data maintains data consistency across all tables:

1. **Departments ↔ Doctors**: Department head_doctor_id linked to senior doctors
2. **Rooms ↔ Departments**: Rooms assigned to departments
3. **Patients ↔ Admissions ↔ Rooms**: Patient admits create room occupancy
4. **Doctors ↔ Appointments**: Doctor-patient scheduling
5. **Appointments ↔ Bills**: Service charges linked to appointments
6. **Patients ↔ Medical Records**: Complete visit history
7. **Bills ↔ Bill Items**: Itemized charges with correct totals

### Auto-sync Features
The seed migration includes UPDATE queries that automatically:
- Update room occupancy counts based on active admissions
- Update room status (available/occupied) based on capacity
- Sync patient status (admitted/discharged) with admission records

---

## 📁 Files Modified/Created

### Modified Files
1. `src/components/Auth.tsx` - Simplified authentication UI
2. `src/hooks/useAuth.tsx` - Restricted signup to admin only
3. `server.mjs` - Server-side signup restrictions
4. `package.json` - Added seed script

### Created Files
1. `supabase/migrations/20260615_003_seed_data.sql` - Seed data migration
2. `scripts/seed-db.mjs` - Seed execution script

---

## 🔒 Admin Account Creation

To create an admin account:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the application**: http://localhost:5173

3. **Click "Create admin account" or "Sign up"**

4. **Fill in the form**:
   - First Name
   - Last Name
   - Email
   - Password (min 6 characters)

5. **Login with the created credentials**

---

## 💾 Data Persistence

All dummy data is permanent in the database until manually deleted. The seed data includes:

- Realistic names and contact information
- Interconnected relationships (e.g., doctors in departments)
- Various statuses for testing (active, pending, paid, etc.)
- Historical and future dates for appointments
- Proper UUID v4 identifiers matching PostgreSQL types

---

## 🎯 Key Features Maintained

✅ Admin authentication and authorization
✅ Full CRUD operations via REST API
✅ Relational data integrity
✅ Role-based access control
✅ Comprehensive query support
✅ Historical data tracking

---

## 🚫 Removed Features

❌ Patient self-registration
❌ Patient login portal
❌ Doctor registration
❌ Doctor login portal
❌ Patient/Doctor role selection

---

## 📞 Support

For queries or issues:
1. Check the example queries in the output of `npm run seed`
2. Review the database schema in `supabase/migrations/`
3. Inspect the seed data in `supabase/migrations/20260615_003_seed_data.sql`

---

**Last Updated**: June 15, 2026
**Version**: 1.0
