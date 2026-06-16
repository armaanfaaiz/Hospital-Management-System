-- Hospital Management System - Example SQL Queries
-- Use these queries to explore and analyze the populated database

-- ============================================================================
-- PATIENTS QUERIES
-- ============================================================================

-- Get all patients with their current status
SELECT id, first_name, last_name, status, blood_type, insurance_number, created_at 
FROM patients 
ORDER BY created_at DESC;

-- Find patients by status
SELECT first_name, last_name, email, phone, status 
FROM patients 
WHERE status = 'admitted';

-- Count patients by status
SELECT status, COUNT(*) as patient_count 
FROM patients 
GROUP BY status 
ORDER BY patient_count DESC;

-- Get patients with specific blood type
SELECT first_name, last_name, blood_type, insurance_number 
FROM patients 
WHERE blood_type = 'O+' OR blood_type = 'A+';

-- ============================================================================
-- DOCTORS QUERIES
-- ============================================================================

-- Get all active doctors with their department
SELECT d.id, d.first_name, d.last_name, d.specialization, d.status, dp.name as department, d.hire_date
FROM doctors d
LEFT JOIN departments dp ON d.department_id = dp.id 
WHERE d.status = 'active'
ORDER BY d.hire_date DESC;

-- Count doctors by specialization
SELECT specialization, COUNT(*) as doctor_count 
FROM doctors 
GROUP BY specialization;

-- Get department heads (doctors who manage departments)
SELECT d.first_name, d.last_name, d.specialization, dp.name as department 
FROM doctors d
JOIN departments dp ON d.id = dp.head_doctor_id;

-- ============================================================================
-- DEPARTMENTS QUERIES
-- ============================================================================

-- Get all departments with their head doctor info
SELECT dp.id, dp.name, dp.description, d.first_name, d.last_name, d.specialization
FROM departments dp
LEFT JOIN doctors d ON dp.head_doctor_id = d.id;

-- Count doctors per department
SELECT dp.name, COUNT(d.id) as doctor_count
FROM departments dp
LEFT JOIN doctors d ON dp.id = d.department_id
GROUP BY dp.name
ORDER BY doctor_count DESC;

-- ============================================================================
-- ROOMS QUERIES
-- ============================================================================

-- Get all rooms with occupancy details
SELECT room_number, room_type, capacity, current_occupancy, status, floor
FROM rooms
ORDER BY floor, room_number;

-- Get occupied rooms
SELECT room_number, room_type, current_occupancy, capacity, status 
FROM rooms 
WHERE status = 'occupied'
ORDER BY room_number;

-- Get available rooms
SELECT room_number, room_type, capacity, status 
FROM rooms 
WHERE status = 'available';

-- Count rooms by type
SELECT room_type, COUNT(*) as count, SUM(capacity) as total_capacity
FROM rooms
GROUP BY room_type;

-- Rooms that need maintenance
SELECT room_number, room_type, status 
FROM rooms 
WHERE status = 'maintenance';

-- ============================================================================
-- APPOINTMENTS QUERIES
-- ============================================================================

-- Get all scheduled appointments (future)
SELECT a.id, a.appointment_date, p.first_name as patient, d.first_name as doctor,
       a.type, a.status, dp.name as department
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN departments dp ON a.department_id = dp.id
WHERE a.appointment_date > NOW() 
ORDER BY a.appointment_date ASC;

-- Get completed appointments
SELECT a.appointment_date, p.first_name as patient, d.first_name as doctor, a.duration_minutes
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.status = 'completed'
ORDER BY a.appointment_date DESC;

-- Count appointments by status
SELECT status, COUNT(*) as count 
FROM appointments 
GROUP BY status;

-- Get appointments with notes
SELECT a.appointment_date, p.first_name, d.first_name, a.type, a.notes
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.notes IS NOT NULL;

-- ============================================================================
-- BILLS QUERIES
-- ============================================================================

-- Get all bills with patient and doctor info
SELECT b.id, b.bill_date, p.first_name as patient, b.total, b.status, b.due_date
FROM bills b
JOIN patients p ON b.patient_id = p.id
ORDER BY b.bill_date DESC;

-- Bill summary by status
SELECT status, COUNT(*) as count, SUM(total) as total_amount, AVG(total) as avg_amount
FROM bills 
GROUP BY status;

-- Overdue bills (past due date and not paid)
SELECT b.id, p.first_name, p.last_name, b.total, b.due_date, 
       CURRENT_DATE - b.due_date as days_overdue
FROM bills b
JOIN patients p ON b.patient_id = p.id
WHERE b.status IN ('pending', 'overdue') AND b.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- Paid bills amount this month
SELECT SUM(total) as total_paid, COUNT(*) as bill_count
FROM bills
WHERE status = 'paid' AND bill_date >= DATE_TRUNC('month', CURRENT_DATE);

-- ============================================================================
-- BILL ITEMS QUERIES
-- ============================================================================

-- Get all bill items with bill details
SELECT bi.id, b.id as bill_id, p.first_name as patient, bi.description, 
       bi.quantity, bi.unit_price, bi.total_price, bi.item_type
FROM bill_items bi
JOIN bills b ON bi.bill_id = b.id
JOIN patients p ON b.patient_id = p.id
ORDER BY bi.item_type, bi.description;

-- Revenue by service type
SELECT item_type, COUNT(*) as item_count, SUM(total_price) as revenue
FROM bill_items
GROUP BY item_type
ORDER BY revenue DESC;

-- Most common services/items
SELECT description, COUNT(*) as frequency, SUM(total_price) as total_revenue
FROM bill_items
GROUP BY description
ORDER BY frequency DESC
LIMIT 10;

-- ============================================================================
-- MEDICAL RECORDS QUERIES
-- ============================================================================

-- Get all medical records
SELECT mr.id, mr.visit_date, p.first_name as patient, d.first_name as doctor, 
       mr.diagnosis, mr.treatment
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
LEFT JOIN doctors d ON mr.doctor_id = d.id
ORDER BY mr.visit_date DESC;

-- Get patient medical history
SELECT mr.visit_date, mr.diagnosis, mr.symptoms, mr.treatment, mr.prescription, 
       d.first_name as doctor, mr.follow_up_date
FROM medical_records mr
LEFT JOIN doctors d ON mr.doctor_id = d.id
WHERE mr.patient_id = '550e8400-e29b-41d4-a716-446655440201'
ORDER BY mr.visit_date DESC;

-- Common diagnoses
SELECT diagnosis, COUNT(*) as frequency
FROM medical_records
GROUP BY diagnosis
ORDER BY frequency DESC;

-- Patients with follow-up appointments
SELECT DISTINCT p.id, p.first_name, p.last_name, mr.follow_up_date
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
WHERE mr.follow_up_date IS NOT NULL AND mr.follow_up_date > CURRENT_DATE
ORDER BY mr.follow_up_date ASC;

-- ============================================================================
-- ADMISSIONS QUERIES
-- ============================================================================

-- Get all admissions
SELECT a.id, a.admission_date, p.first_name as patient, d.first_name as doctor, 
       r.room_number, a.reason, a.status
FROM admissions a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN rooms r ON a.room_id = r.id
ORDER BY a.admission_date DESC;

-- Currently admitted patients
SELECT p.first_name, p.last_name, a.admission_date, r.room_number, d.first_name as doctor
FROM admissions a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN rooms r ON a.room_id = r.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.status = 'admitted'
ORDER BY a.admission_date;

-- Length of stay for discharged patients
SELECT p.first_name, p.last_name, a.admission_date, a.discharge_date,
       (a.discharge_date - a.admission_date) as length_of_stay_days
FROM admissions a
JOIN patients p ON a.patient_id = p.id
WHERE a.status = 'discharged'
ORDER BY length_of_stay_days DESC;

-- ============================================================================
-- COMPLEX QUERIES - BUSINESS INSIGHTS
-- ============================================================================

-- Total revenue by department
SELECT dp.name as department, SUM(b.total) as total_revenue
FROM bills b
JOIN appointments ap ON b.appointment_id = ap.id
JOIN departments dp ON ap.department_id = dp.id
WHERE b.status = 'paid'
GROUP BY dp.name
ORDER BY total_revenue DESC;

-- Doctor productivity (appointments per doctor)
SELECT d.first_name, d.last_name, d.specialization, COUNT(a.id) as appointment_count
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id AND a.status IN ('completed', 'scheduled')
GROUP BY d.id, d.first_name, d.last_name, d.specialization
ORDER BY appointment_count DESC;

-- Patient visit frequency
SELECT p.first_name, p.last_name, COUNT(a.id) as appointment_count, COUNT(DISTINCT mr.id) as record_count
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN medical_records mr ON p.id = mr.patient_id
GROUP BY p.id, p.first_name, p.last_name
ORDER BY appointment_count DESC;

-- Hospital occupancy rate
SELECT 
  (SELECT SUM(current_occupancy) FROM rooms) as total_occupied,
  (SELECT SUM(capacity) FROM rooms) as total_capacity,
  ROUND(100.0 * (SELECT SUM(current_occupancy) FROM rooms) / 
        (SELECT SUM(capacity) FROM rooms), 2) as occupancy_percentage;

-- Revenue trends by bill status
SELECT status, COUNT(*) as bill_count, SUM(total) as revenue, AVG(total) as avg_bill
FROM bills
GROUP BY status
ORDER BY revenue DESC;
