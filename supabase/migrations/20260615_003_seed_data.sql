-- Seed Data for Hospital Management System
-- This migration adds realistic dummy data for departments, doctors, patients, rooms, and related records

-- Departments
INSERT INTO departments (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Cardiology', 'Heart and cardiovascular diseases'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Neurology', 'Brain and nervous system diseases'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Orthopedics', 'Bone and joint diseases'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Pediatrics', 'Children and infant care'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Emergency', 'Emergency and critical care')
ON CONFLICT DO NOTHING;

-- Doctors
INSERT INTO doctors (id, first_name, last_name, email, phone, specialization, department_id, license_number, status, hire_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'Dr. Rajesh', 'Kumar', 'rajesh.kumar@hospital.com', '9876543210', 'Cardiology', '550e8400-e29b-41d4-a716-446655440001', 'MD-2020-001', 'active', '2020-01-15'),
  ('550e8400-e29b-41d4-a716-446655440102', 'Dr. Priya', 'Sharma', 'priya.sharma@hospital.com', '9876543211', 'Neurology', '550e8400-e29b-41d4-a716-446655440002', 'MD-2019-002', 'active', '2019-06-10'),
  ('550e8400-e29b-41d4-a716-446655440103', 'Dr. Arjun', 'Singh', 'arjun.singh@hospital.com', '9876543212', 'Orthopedics', '550e8400-e29b-41d4-a716-446655440003', 'MD-2021-003', 'active', '2021-03-20'),
  ('550e8400-e29b-41d4-a716-446655440104', 'Dr. Meera', 'Patel', 'meera.patel@hospital.com', '9876543213', 'Pediatrics', '550e8400-e29b-41d4-a716-446655440004', 'MD-2018-004', 'active', '2018-09-05'),
  ('550e8400-e29b-41d4-a716-446655440105', 'Dr. Vikram', 'Verma', 'vikram.verma@hospital.com', '9876543214', 'Emergency Medicine', '550e8400-e29b-41d4-a716-446655440005', 'MD-2017-005', 'active', '2017-02-11'),
  ('550e8400-e29b-41d4-a716-446655440106', 'Dr. Anjali', 'Gupta', 'anjali.gupta@hospital.com', '9876543215', 'Cardiology', '550e8400-e29b-41d4-a716-446655440001', 'MD-2022-006', 'active', '2022-07-08')
ON CONFLICT DO NOTHING;

-- Update departments with head doctors
UPDATE departments SET head_doctor_id = '550e8400-e29b-41d4-a716-446655440101' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE departments SET head_doctor_id = '550e8400-e29b-41d4-a716-446655440102' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE departments SET head_doctor_id = '550e8400-e29b-41d4-a716-446655440103' WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE departments SET head_doctor_id = '550e8400-e29b-41d4-a716-446655440104' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE departments SET head_doctor_id = '550e8400-e29b-41d4-a716-446655440105' WHERE id = '550e8400-e29b-41d4-a716-446655440005';

-- Patients
INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, email, phone, address, emergency_contact, emergency_phone, blood_type, insurance_number, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', 'Arun', 'Malhotra', '1975-05-12', 'male', 'arun.malhotra@email.com', '9988776655', '123 MG Road, Bangalore', 'Kavya Malhotra', '9988776666', 'O+', 'INS-001-2024', 'outpatient'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Neha', 'Reddy', '1982-08-23', 'female', 'neha.reddy@email.com', '9988776656', '456 Park Avenue, Delhi', 'Vikram Reddy', '9988776667', 'A+', 'INS-002-2024', 'admitted'),
  ('550e8400-e29b-41d4-a716-446655440203', 'Suresh', 'Iyer', '1968-12-30', 'male', 'suresh.iyer@email.com', '9988776657', '789 Marina Drive, Chennai', 'Priya Iyer', '9988776668', 'B+', 'INS-003-2024', 'outpatient'),
  ('550e8400-e29b-41d4-a716-446655440204', 'Divya', 'Nair', '1990-03-15', 'female', 'divya.nair@email.com', '9988776658', '321 Silver Oaks, Kochi', 'Ravi Nair', '9988776669', 'AB+', 'INS-004-2024', 'admitted'),
  ('550e8400-e29b-41d4-a716-446655440205', 'Amit', 'Chopra', '1985-07-08', 'male', 'amit.chopra@email.com', '9988776659', '654 Garden View, Mumbai', 'Sunita Chopra', '9988776670', 'O-', 'INS-005-2024', 'outpatient'),
  ('550e8400-e29b-41d4-a716-446655440206', 'Seema', 'Singh', '1992-11-20', 'female', 'seema.singh@email.com', '9988776660', '987 Maple Street, Pune', 'Rohit Singh', '9988776671', 'A-', 'INS-006-2024', 'outpatient'),
  ('550e8400-e29b-41d4-a716-446655440207', 'Rohit', 'Kumar', '1978-06-10', 'male', 'rohit.kumar@email.com', '9988776661', '147 Sunflower Lane, Hyderabad', 'Maya Kumar', '9988776672', 'B-', 'INS-007-2024', 'admitted'),
  ('550e8400-e29b-41d4-a716-446655440208', 'Pooja', 'Desai', '1988-09-25', 'female', 'pooja.desai@email.com', '9988776662', '258 Rose Garden, Ahmedabad', 'Arjun Desai', '9988776673', 'AB-', 'INS-008-2024', 'discharged')
ON CONFLICT DO NOTHING;

-- Rooms
INSERT INTO rooms (id, room_number, room_type, department_id, capacity, current_occupancy, status, floor) VALUES
  ('550e8400-e29b-41d4-a716-446655440301', '101', 'general', '550e8400-e29b-41d4-a716-446655440001', 4, 2, 'occupied', 1),
  ('550e8400-e29b-41d4-a716-446655440302', '102', 'private', '550e8400-e29b-41d4-a716-446655440001', 1, 1, 'occupied', 1),
  ('550e8400-e29b-41d4-a716-446655440303', '201', 'icu', '550e8400-e29b-41d4-a716-446655440002', 6, 3, 'occupied', 2),
  ('550e8400-e29b-41d4-a716-446655440304', '202', 'general', '550e8400-e29b-41d4-a716-446655440002', 4, 1, 'occupied', 2),
  ('550e8400-e29b-41d4-a716-446655440305', '301', 'operating', '550e8400-e29b-41d4-a716-446655440003', 2, 0, 'available', 3),
  ('550e8400-e29b-41d4-a716-446655440306', '302', 'general', '550e8400-e29b-41d4-a716-446655440003', 4, 2, 'occupied', 3),
  ('550e8400-e29b-41d4-a716-446655440307', '401', 'private', '550e8400-e29b-41d4-a716-446655440004', 1, 1, 'occupied', 4),
  ('550e8400-e29b-41d4-a716-446655440308', '402', 'general', '550e8400-e29b-41d4-a716-446655440004', 4, 3, 'occupied', 4),
  ('550e8400-e29b-41d4-a716-446655440309', '501', 'emergency', '550e8400-e29b-41d4-a716-446655440005', 8, 4, 'occupied', 5),
  ('550e8400-e29b-41d4-a716-446655440310', '502', 'emergency', '550e8400-e29b-41d4-a716-446655440005', 8, 2, 'occupied', 5)
ON CONFLICT DO NOTHING;

-- Admissions (linking patients and rooms)
INSERT INTO admissions (id, patient_id, room_id, doctor_id, admission_date, reason, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440102', NOW() - INTERVAL '5 days', 'Migraine with fever', 'admitted', 'Continuous monitoring required'),
  ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440103', NOW() - INTERVAL '3 days', 'Fractured left leg', 'admitted', 'Post-surgery recovery'),
  ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440101', NOW() - INTERVAL '2 days', 'Chest pain and hypertension', 'admitted', 'Cardiac evaluation ongoing'),
  ('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440408', '550e8400-e29b-41d4-a716-446655440104', NOW() - INTERVAL '10 days', 'Appendicitis', 'discharged', 'Recovered well, discharged on day 10')
ON CONFLICT DO NOTHING;

-- Appointments
INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, duration_minutes, type, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '2 days', 30, 'consultation', 'scheduled', 'Regular checkup for cardiac health'),
  ('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '5 days', 30, 'follow_up', 'scheduled', 'Follow-up after last visit'),
  ('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '3 days', 45, 'consultation', 'confirmed', 'Neurological assessment'),
  ('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', NOW() + INTERVAL '7 days', 30, 'routine', 'scheduled', 'Routine checkup for orthopedic health'),
  ('550e8400-e29b-41d4-a716-446655440505', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '2 days', 60, 'consultation', 'completed', 'Initial evaluation completed')
ON CONFLICT DO NOTHING;

-- Medical Records
INSERT INTO medical_records (id, patient_id, doctor_id, visit_date, diagnosis, symptoms, treatment, prescription, notes, follow_up_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', NOW() - INTERVAL '10 days', 'Hypertension Stage 2', 'Headaches, dizziness', 'Medication adjustment recommended', 'Amlodipine 5mg daily', 'Regular monitoring needed', CURRENT_DATE + INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', NOW() - INTERVAL '5 days', 'Acute Migraine', 'Severe headache, photophobia, nausea', 'Rest and medication', 'Sumatriptan 50mg as needed', 'Monitor for frequency', CURRENT_DATE + INTERVAL '14 days'),
  ('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', NOW() - INTERVAL '15 days', 'Coronary Artery Disease', 'Chest pain on exertion', 'Angiography recommended', 'Aspirin 100mg daily, Atorvastatin 20mg', 'Scheduled for stress test', CURRENT_DATE + INTERVAL '21 days'),
  ('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440103', NOW() - INTERVAL '3 days', 'Tibial Fracture', 'Severe pain, swelling', 'Surgical intervention performed', 'Pain management, physical therapy', 'Post-operative care ongoing', CURRENT_DATE + INTERVAL '60 days'),
  ('550e8400-e29b-41d4-a716-446655440605', '550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440102', NOW() - INTERVAL '8 days', 'Tension Headache', 'Mild to moderate headache', 'Stress management and rest', 'Paracetamol 500mg as needed', 'Lifestyle modifications recommended', CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Bills with related items
INSERT INTO bills (id, patient_id, doctor_id, appointment_id, bill_date, due_date, status, subtotal, tax, discount, total, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440501', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 'pending', 5000, 900, 500, 5400, 'Consultation and cardiac tests'),
  ('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', NULL, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 'paid', 12000, 2160, 1000, 13160, 'ICU admission and treatment'),
  ('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', NULL, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '27 days', 'pending', 8500, 1530, 0, 10030, 'Cardiac evaluation and imaging'),
  ('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440103', NULL, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 'paid', 35000, 6300, 2000, 39300, 'Surgical procedure and hospitalization'),
  ('550e8400-e29b-41d4-a716-446655440705', '550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440503', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '28 days', 'pending', 3000, 540, 0, 3540, 'Neurological consultation')
ON CONFLICT DO NOTHING;

-- Bill Items
INSERT INTO bill_items (id, bill_id, description, quantity, unit_price, total_price, item_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440801', '550e8400-e29b-41d4-a716-446655440701', 'Consultation Fee', 1, 1000, 1000, 'consultation'),
  ('550e8400-e29b-41d4-a716-446655440802', '550e8400-e29b-41d4-a716-446655440701', 'ECG Test', 1, 2000, 2000, 'procedure'),
  ('550e8400-e29b-41d4-a716-446655440803', '550e8400-e29b-41d4-a716-446655440701', 'Blood Tests', 1, 2000, 2000, 'procedure'),
  ('550e8400-e29b-41d4-a716-446655440804', '550e8400-e29b-41d4-a716-446655440702', 'ICU Room Charge (per day)', 10, 1000, 10000, 'room'),
  ('550e8400-e29b-41d4-a716-446655440805', '550e8400-e29b-41d4-a716-446655440702', 'Medications', 1, 2000, 2000, 'medication'),
  ('550e8400-e29b-41d4-a716-446655440806', '550e8400-e29b-41d4-a716-446655440703', 'Cardiac Imaging (CT)', 1, 5000, 5000, 'procedure'),
  ('550e8400-e29b-41d4-a716-446655440807', '550e8400-e29b-41d4-a716-446655440703', 'Consultation Fee', 1, 1500, 1500, 'consultation'),
  ('550e8400-e29b-41d4-a716-446655440808', '550e8400-e29b-41d4-a716-446655440703', 'Follow-up Consultation', 1, 2000, 2000, 'consultation'),
  ('550e8400-e29b-41d4-a716-446655440809', '550e8400-e29b-41d4-a716-446655440704', 'Surgical Procedure', 1, 20000, 20000, 'procedure'),
  ('550e8400-e29b-41d4-a716-446655440810', '550e8400-e29b-41d4-a716-446655440704', 'Room Charge (5 days)', 5, 2000, 10000, 'room'),
  ('550e8400-e29b-41d4-a716-446655440811', '550e8400-e29b-41d4-a716-446655440704', 'Post-operative Care', 1, 5000, 5000, 'service'),
  ('550e8400-e29b-41d4-a716-446655440812', '550e8400-e29b-41d4-a716-446655440705', 'Neurological Consultation', 1, 3000, 3000, 'consultation')
ON CONFLICT DO NOTHING;

-- Additional Appointments for better coverage
INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, duration_minutes, type, status, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440506', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '3 days', 60, 'surgery', 'completed', 'Fracture repair surgery'),
  ('550e8400-e29b-41d4-a716-446655440507', '550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days', 30, 'consultation', 'completed', 'Cardiac consultation'),
  ('550e8400-e29b-41d4-a716-446655440508', '550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '10 days', 45, 'routine', 'completed', 'Post-operative checkup')
ON CONFLICT DO NOTHING;

-- Sync all data - ensure everything is consistent
-- Update current_occupancy in rooms based on active admissions
UPDATE rooms
SET current_occupancy = (
  SELECT COUNT(DISTINCT a.id)
  FROM admissions a
  WHERE a.room_id = rooms.id AND a.status = 'admitted'
)
WHERE room_type IN ('general', 'private', 'icu', 'operating', 'emergency');

-- Update room status based on occupancy
UPDATE rooms
SET status = CASE
  WHEN current_occupancy = 0 THEN 'available'
  WHEN current_occupancy >= capacity THEN 'occupied'
  ELSE 'occupied'
END
WHERE room_type IN ('general', 'private', 'icu', 'operating', 'emergency');

-- Ensure patients admitted status is consistent with admissions
UPDATE patients
SET status = 'admitted'
WHERE id IN (
  SELECT DISTINCT patient_id FROM admissions WHERE status = 'admitted'
);

UPDATE patients
SET status = 'discharged'
WHERE id IN (
  SELECT DISTINCT patient_id FROM admissions WHERE status = 'discharged' AND discharge_date IS NOT NULL
);
