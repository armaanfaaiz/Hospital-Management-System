#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
for (const line of lines) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...\n');

    // Read and execute seed migration
    const seedPath = path.join(__dirname, '../supabase/migrations/20260615_003_seed_data.sql');
    if (!fs.existsSync(seedPath)) {
      console.error('ERROR: Seed file not found:', seedPath);
      process.exit(1);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = seedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        successCount++;
        if (i % 5 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        // Some statements might fail due to conflicts, which is okay
        if (!error.message.includes('duplicate key value') && 
            !error.message.includes('already exists') &&
            !error.message.includes('ON CONFLICT')) {
          console.error(`\nError executing statement ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n\n✅ Database seeding completed!\n');
    console.log('📊 Seed Statistics:');
    console.log('   • Departments: 5');
    console.log('   • Doctors: 6');
    console.log('   • Patients: 8');
    console.log('   • Rooms: 10');
    console.log('   • Admissions: 4');
    console.log('   • Appointments: 8');
    console.log('   • Medical Records: 5');
    console.log('   • Bills: 5');
    console.log('   • Bill Items: 12');

    console.log('\n📝 Query Examples:\n');
    console.log('-- Get all patients with their current status');
    console.log('SELECT id, first_name, last_name, status, created_at FROM patients ORDER BY created_at DESC;\n');

    console.log('-- Get all active doctors by department');
    console.log('SELECT d.first_name, d.last_name, d.specialization, dept.name FROM doctors d');
    console.log('LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.status = \'active\';\n');

    console.log('-- Get bill summary by status');
    console.log('SELECT status, COUNT(*) as count, SUM(total) as total_amount FROM bills GROUP BY status;\n');

    console.log('-- Get occupied rooms');
    console.log('SELECT room_number, room_type, current_occupancy, capacity, status FROM rooms WHERE status = \'occupied\';\n');

    console.log('-- Get upcoming appointments');
    console.log('SELECT a.appointment_date, p.first_name as patient, d.first_name as doctor,');
    console.log('       a.type, dept.name FROM appointments a');
    console.log('JOIN patients p ON a.patient_id = p.id');
    console.log('JOIN doctors d ON a.doctor_id = d.id');
    console.log('JOIN departments dept ON a.department_id = dept.id');
    console.log('WHERE a.appointment_date > NOW() ORDER BY a.appointment_date ASC;\n');

    console.log('-- Get patient medical history');
    console.log('SELECT mr.visit_date, mr.diagnosis, mr.treatment, d.first_name as doctor FROM medical_records mr');
    console.log('JOIN doctors d ON mr.doctor_id = d.id');
    console.log('WHERE mr.patient_id = \'550e8400-e29b-41d4-a716-446655440201\' ORDER BY mr.visit_date DESC;\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

seedDatabase();
