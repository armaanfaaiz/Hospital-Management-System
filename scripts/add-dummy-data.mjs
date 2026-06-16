import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';

async function request(path, method='GET', token=null, body=null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch(e) { throw new Error(`Invalid JSON response from ${path}: ${text}`); }
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function main() {
  console.log('\n🔁 Adding dummy doctors, patients, appointments, bills...\n');

  // login
  const login = await request('/api/auth/login', 'POST', null, { email: 'admin@hospital.com', password: 'TestPass123' });
  const token = login.session.access_token;
  console.log('🔐 Logged in as', login.user.email);

  // Doctors
  const doctorsPayload = [
    { first_name: 'Ratan', last_name: 'Kumar', email: 'ratan.kumar@hospital.com', phone: '9000000001', specialization: 'Cardiology', department_id: null, license_number: 'LIC-1001', status: 'active' },
    { first_name: 'Sonia', last_name: 'Verma', email: 'sonia.verma@hospital.com', phone: '9000000002', specialization: 'Neurology', department_id: null, license_number: 'LIC-1002', status: 'active' },
    { first_name: 'Amit', last_name: 'Gupta', email: 'amit.gupta@hospital.com', phone: '9000000003', specialization: 'Orthopedics', department_id: null, license_number: 'LIC-1003', status: 'active' }
  ];
  const doctorsRes = await request('/api/doctors', 'POST', token, doctorsPayload);
  const doctors = doctorsRes.data;
  console.log(`✅ Created ${doctors.length} doctors`);

  // Patients
  const patientsPayload = [
    { first_name: 'Anas', last_name: 'Ahmad', date_of_birth: '1985-04-12', gender: 'male', email: 'anas.ahmad@example.com', phone: '9011110001', address: '12 Green St', blood_type: 'O+', status: 'outpatient' },
    { first_name: 'Maya', last_name: 'Shah', date_of_birth: '1992-11-05', gender: 'female', email: 'maya.shah@example.com', phone: '9011110002', address: '34 Blue Ave', blood_type: 'A+', status: 'admitted' },
    { first_name: 'Lalit', last_name: 'Rao', date_of_birth: '1978-07-22', gender: 'male', email: 'lalit.rao@example.com', phone: '9011110003', address: '56 Oak Road', blood_type: 'B+', status: 'outpatient' }
  ];
  const patientsRes = await request('/api/patients', 'POST', token, patientsPayload);
  const patients = patientsRes.data;
  console.log(`✅ Created ${patients.length} patients`);

  // Appointments - link patients and doctors
  const appointmentsPayload = [
    { patient_id: patients[0].id, doctor_id: doctors[0].id, department_id: null, appointment_date: new Date(Date.now() + 2*24*3600*1000).toISOString(), duration_minutes: 30, type: 'consultation', status: 'scheduled' },
    { patient_id: patients[1].id, doctor_id: doctors[1].id, department_id: null, appointment_date: new Date(Date.now() + 3*24*3600*1000).toISOString(), duration_minutes: 45, type: 'follow_up', status: 'scheduled' },
    { patient_id: patients[2].id, doctor_id: doctors[2].id, department_id: null, appointment_date: new Date(Date.now() - 2*24*3600*1000).toISOString(), duration_minutes: 60, type: 'surgery', status: 'completed' }
  ];
  const apptsRes = await request('/api/appointments', 'POST', token, appointmentsPayload);
  const appointments = apptsRes.data;
  console.log(`✅ Created ${appointments.length} appointments`);

  // Bills and bill items
  const billsPayload = [
    { patient_id: patients[0].id, doctor_id: doctors[0].id, appointment_id: appointments[0].id, bill_date: new Date().toISOString().slice(0,10), due_date: new Date(Date.now()+30*24*3600*1000).toISOString().slice(0,10), status: 'pending', subtotal: 1000, tax: 100, discount: 0, total: 1100, notes: 'Consultation fee' },
    { patient_id: patients[1].id, doctor_id: doctors[1].id, appointment_id: appointments[1].id, bill_date: new Date().toISOString().slice(0,10), due_date: new Date(Date.now()+15*24*3600*1000).toISOString().slice(0,10), status: 'paid', subtotal: 5000, tax: 500, discount: 200, total: 5300, notes: 'Procedure and tests' }
  ];
  const billsRes = await request('/api/bills', 'POST', token, billsPayload);
  const bills = billsRes.data;
  console.log(`✅ Created ${bills.length} bills`);

  const billItemsPayload = [
    { bill_id: bills[0].id, description: 'Consultation', quantity: 1, unit_price: 1000, total_price: 1000, item_type: 'consultation' },
    { bill_id: bills[1].id, description: 'Surgery', quantity: 1, unit_price: 4000, total_price: 4000, item_type: 'procedure' },
    { bill_id: bills[1].id, description: 'Medication', quantity: 1, unit_price: 1000, total_price: 1000, item_type: 'medication' }
  ];
  const itemsRes = await request('/api/bill_items', 'POST', token, billItemsPayload);
  const items = itemsRes.data;
  console.log(`✅ Created ${items.length} bill items`);

  // Summary
  console.log('\n📌 Summary:');
  console.log('Doctors:', doctors.map(d=>d.first_name+' '+d.last_name).join(', '));
  console.log('Patients:', patients.map(p=>p.first_name+' '+p.last_name).join(', '));
  console.log('Appointments:', appointments.map(a=>a.id).join(', '));
  console.log('Bills:', bills.map(b=>b.id).join(', '));

  console.log('\n🎉 Dummy data added successfully!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
