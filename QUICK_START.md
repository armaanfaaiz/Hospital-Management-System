# Quick Start Guide - Hospital Management System

## 🎯 What's Been Done

### 1. ✅ Authentication Simplified
- **Removed**: Patient and Doctor login portals
- **Kept**: Admin login and registration only
- Users can only create/login as admin accounts

### 2. ✅ Database Populated
- **Departments**: 5 records
- **Doctors**: 6 records  
- **Patients**: 8 records
- **Rooms**: 10 records
- **Appointments**: 8 records
- **Medical Records**: 5 records
- **Bills**: 5 records with 12 line items
- **Admissions**: 4 records

### 3. ✅ Data Synchronized
All tables are interconnected and consistent. You can run queries like:
```sql
-- See all doctors
SELECT * FROM doctors;

-- See all patients
SELECT * FROM patients;

-- See bills with amounts
SELECT id, patient_id, total, status FROM bills;

-- See appointments with doctor and patient info
SELECT a.*, p.first_name as patient_name, d.first_name as doctor_name 
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id;
```

---

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm run dev
```

The app will run at `http://localhost:5173`

### Step 3: Create Admin Account
1. Click "Create admin account"
2. Fill in details (First Name, Last Name, Email, Password)
3. Submit - You'll automatically be logged in

### Step 4: Login
- Use your admin credentials to login
- Access the admin dashboard
- Manage patients, doctors, rooms, bills, etc.

---

## 📊 Available Data for Queries

You now have realistic data to query:

```sql
-- Count patients by status
SELECT status, COUNT(*) FROM patients GROUP BY status;

-- Find doctors in each department
SELECT d.first_name, d.last_name, dp.name 
FROM doctors d
LEFT JOIN departments dp ON d.department_id = dp.id;

-- Get all pending bills
SELECT patient_id, total, due_date FROM bills WHERE status = 'pending';

-- See room occupancy
SELECT room_number, room_type, current_occupancy, capacity FROM rooms;

-- Patient appointment history
SELECT a.appointment_date, d.first_name as doctor, a.type, a.status
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
WHERE a.patient_id = '[patient-id]';
```

---

## 📝 File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `src/components/Auth.tsx` | Removed patient/doctor login options | Login UI simplified to admin only |
| `src/hooks/useAuth.tsx` | Restricted signup to admin role | Only admin registration allowed |
| `server.mjs` | Signup endpoint rejects non-admin roles | Backend enforces admin-only rule |
| `supabase/migrations/20260615_003_seed_data.sql` | NEW: Seed migration with dummy data | Database populated with 50+ records |
| `scripts/seed-db.mjs` | NEW: Seed script | Run with `npm run seed` |
| `package.json` | Added seed script | Can run `npm run seed` |

---

## 🔐 Login Behavior

### Before Changes
✗ 3 Login Options: Admin, Patient, Doctor
✗ Free Registration for any role

### After Changes  
✓ Single Login Option: Admin Only
✓ Admin registration only
✓ All data (patients, doctors, etc.) created via admin panel

---

## 🎓 Testing the Setup

### Test 1: Verify Admin Login
1. Start app: `npm run dev`
2. Create new admin account
3. Login successfully
4. Access admin dashboard

### Test 2: Verify Dummy Data
```bash
npm run seed
```
This shows available data and example queries

### Test 3: Query the Data
Use any SQL client to connect to your database and run queries from the examples above

---

## 📚 Full Documentation

For complete details, see: `CHANGES.md`

Contains:
- Detailed file modifications
- Complete seed data overview
- 10+ Example queries
- Data relationship diagrams
- Troubleshooting guide

---

## ✨ Next Steps

1. **Run the app**: `npm run dev`
2. **Create admin account**: Use signup form
3. **Explore dashboard**: View patients, doctors, rooms, bills
4. **Query data**: Write SQL queries against dummy data
5. **Customize**: Modify UI, add features, etc.

---

**Status**: ✅ All changes complete
**Database**: ✅ Populated with dummy data  
**Testing**: ✅ Ready for use
