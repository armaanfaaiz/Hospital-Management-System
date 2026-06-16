import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.join(__dirname, '.env'));

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 5173);
const jwtSecret = process.env.JWT_SECRET || 'dev-only-change-me';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static files from dist in production
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production' || process.env.VERCEL;
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
}

const tableConfig = {
  app_users: { columns: ['id', 'email', 'password_hash', 'role', 'first_name', 'last_name', 'phone', 'created_at', 'updated_at'] },
  profiles: { columns: ['id', 'user_id', 'role', 'first_name', 'last_name', 'phone', 'created_at', 'updated_at'] },
  departments: { columns: ['id', 'name', 'description', 'head_doctor_id', 'created_at'] },
  doctors: { columns: ['id', 'first_name', 'last_name', 'email', 'phone', 'specialization', 'department_id', 'license_number', 'status', 'hire_date', 'created_at'] },
  patients: { columns: ['id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone', 'address', 'emergency_contact', 'emergency_phone', 'blood_type', 'insurance_number', 'status', 'created_at', 'updated_at'] },
  rooms: { columns: ['id', 'room_number', 'room_type', 'department_id', 'capacity', 'current_occupancy', 'status', 'floor', 'created_at'] },
  admissions: { columns: ['id', 'patient_id', 'room_id', 'doctor_id', 'admission_date', 'discharge_date', 'reason', 'status', 'notes', 'created_at'] },
  appointments: { columns: ['id', 'patient_id', 'doctor_id', 'department_id', 'appointment_date', 'duration_minutes', 'type', 'status', 'notes', 'created_at'] },
  medical_records: { columns: ['id', 'patient_id', 'doctor_id', 'visit_date', 'diagnosis', 'symptoms', 'treatment', 'prescription', 'notes', 'follow_up_date', 'created_at'] },
  bills: { columns: ['id', 'patient_id', 'doctor_id', 'appointment_id', 'bill_date', 'due_date', 'status', 'subtotal', 'tax', 'discount', 'total', 'notes', 'created_at', 'updated_at'] },
  bill_items: { columns: ['id', 'bill_id', 'description', 'quantity', 'unit_price', 'total_price', 'item_type', 'created_at'] },
};

const relations = {
  appointments: [
    { marker: 'patient:', alias: 'patient', table: 'patients', localKey: 'patient_id', remoteKey: 'id', many: false },
    { marker: 'doctor:', alias: 'doctor', table: 'doctors', localKey: 'doctor_id', remoteKey: 'id', many: false },
    { marker: 'department:', alias: 'department', table: 'departments', localKey: 'department_id', remoteKey: 'id', many: false },
  ],
  bills: [
    { marker: 'patient:', alias: 'patient', table: 'patients', localKey: 'patient_id', remoteKey: 'id', many: false },
    { marker: 'doctor:', alias: 'doctor', table: 'doctors', localKey: 'doctor_id', remoteKey: 'id', many: false },
    { marker: 'items:', alias: 'items', table: 'bill_items', localKey: 'id', remoteKey: 'bill_id', many: true },
  ],
  doctors: [
    { marker: 'department:', alias: 'department', table: 'departments', localKey: 'department_id', remoteKey: 'id', many: false },
  ],
  departments: [
    { marker: 'head_doctor:', alias: 'head_doctor', table: 'doctors', localKey: 'head_doctor_id', remoteKey: 'id', many: false },
  ],
  medical_records: [
    { marker: 'patient:', alias: 'patient', table: 'patients', localKey: 'patient_id', remoteKey: 'id', many: false },
    { marker: 'doctor:', alias: 'doctor', table: 'doctors', localKey: 'doctor_id', remoteKey: 'id', many: false },
  ],
  rooms: [
    { marker: 'department:', alias: 'department', table: 'departments', localKey: 'department_id', remoteKey: 'id', many: false },
  ],
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, role = 'admin', firstName = '', lastName = '' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (role !== 'admin') return res.status(400).json({ error: 'Only admin registration is allowed' });

    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO app_users (email, password_hash, role, first_name, last_name)
       VALUES (LOWER($1), $2, $3, $4, $5)
       RETURNING id, email, role, first_name, last_name, phone, created_at, updated_at`,
      [email, passwordHash, 'admin', firstName, lastName]
    );
    const user = publicUser(rows[0]);
    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    res.json({ user, session: { access_token: token, user } });
  } catch (error) {
    sendPgError(res, error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM app_users WHERE email = LOWER($1)', [email]);
  const userRow = rows[0];
  if (!userRow || !(await verifyPassword(password || '', userRow.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = publicUser(userRow);
  const token = signJwt({ sub: user.id, email: user.email, role: user.role });
  res.json({ user, session: { access_token: token, user } });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.json({ user: req.user, session: { access_token: req.token, user: req.user } });
});

app.get('/api/:table', requireAuth, async (req, res) => {
  try {
    const table = requireTable(req.params.table);
    const params = req.query;
    const values = [];
    const where = buildWhere(table, params, values);
    const order = buildOrder(table, params.order);
    const limit = buildLimit(params.limit, values);
    const sql = `SELECT * FROM ${ident(table)}${where}${order}${limit}`;
    const { rows } = await pool.query(sql, values);
    const data = await attachRelations(table, rows, String(params.select || '*'));
    res.json({ data: params.single === 'true' ? data[0] || null : data, count: data.length });
  } catch (error) {
    sendPgError(res, error);
  }
});

app.post('/api/:table', requireAuth, async (req, res) => {
  try {
    const table = requireTable(req.params.table);
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const rows = [];
    for (const item of payload) {
      const insertable = pickColumns(table, item);
      const columns = Object.keys(insertable);
      const values = Object.values(insertable);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const sql = `INSERT INTO ${ident(table)} (${columns.map(ident).join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(sql, values);
      rows.push(result.rows[0]);
    }
    res.json({ data: rows });
  } catch (error) {
    sendPgError(res, error);
  }
});

app.patch('/api/:table', requireAuth, async (req, res) => {
  try {
    const table = requireTable(req.params.table);
    const update = pickColumns(table, req.body);
    const columns = Object.keys(update);
    const values = Object.values(update);
    if (!columns.length) return res.json({ data: [] });
    const sets = columns.map((column, index) => `${ident(column)} = $${index + 1}`).join(', ');
    const where = buildWhere(table, req.query, values);
    const { rows } = await pool.query(`UPDATE ${ident(table)} SET ${sets}${where} RETURNING *`, values);
    res.json({ data: rows });
  } catch (error) {
    sendPgError(res, error);
  }
});

app.delete('/api/:table', requireAuth, async (req, res) => {
  try {
    const table = requireTable(req.params.table);
    const values = [];
    const where = buildWhere(table, req.query, values);
    await pool.query(`DELETE FROM ${ident(table)}${where}`, values);
    res.json({ data: [] });
  } catch (error) {
    sendPgError(res, error);
  }
});

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

// SPA fallback - serve index.html for all unmatched routes in production
if (isProduction) {
  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const host = process.env.VERCEL ? '0.0.0.0' : '127.0.0.1';
app.listen(port, host, () => {
  console.log(`MediCare running at http://${host}:${port}/`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: 'Authentication required' });
  req.token = token;
  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = { ...payload, exp: expiresAt };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', jwtSecret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt);
  return `${salt}:${key}`;
}

async function verifyPassword(password, stored) {
  const [salt, key] = String(stored || '').split(':');
  if (!salt || !key) return false;
  const testKey = await scrypt(password, salt);
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(testKey, 'hex'));
}

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('hex'));
    });
  });
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireTable(table) {
  if (!tableConfig[table]) throw Object.assign(new Error('Unknown table'), { status: 404 });
  return table;
}

function pickColumns(table, item) {
  const allowed = tableConfig[table].columns.filter((column) => !['id', 'created_at'].includes(column));
  return Object.fromEntries(Object.entries(item || {}).filter(([key]) => allowed.includes(key)));
}

function buildWhere(table, params, values) {
  const parts = [];
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (!rawKey.startsWith('filter_')) continue;
    const column = rawKey.slice(7);
    if (!tableConfig[table].columns.includes(column)) continue;
    const [operator, ...rest] = String(rawValue).split('.');
    const value = rest.join('.');
    if (operator === 'eq') {
      values.push(value);
      parts.push(`${ident(column)} = $${values.length}`);
    } else if (operator === 'gte') {
      values.push(value);
      parts.push(`${ident(column)} >= $${values.length}`);
    } else if (operator === 'lt') {
      values.push(value);
      parts.push(`${ident(column)} < $${values.length}`);
    } else if (operator === 'not' && value === 'is.null') {
      parts.push(`${ident(column)} IS NOT NULL`);
    }
  }
  return parts.length ? ` WHERE ${parts.join(' AND ')}` : '';
}

function buildOrder(table, rawOrder) {
  if (!rawOrder) return '';
  const [column, direction = 'asc'] = String(rawOrder).split('.');
  if (!tableConfig[table].columns.includes(column)) return '';
  return ` ORDER BY ${ident(column)} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
}

function buildLimit(rawLimit, values) {
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1) return '';
  values.push(limit);
  return ` LIMIT $${values.length}`;
}

async function attachRelations(table, rows, select) {
  const wanted = (relations[table] || []).filter((relation) => select.includes(relation.marker));
  if (!wanted.length || !rows.length) return rows;
  const output = rows.map((row) => ({ ...row }));
  for (const relation of wanted) {
    const keys = [...new Set(output.map((row) => row[relation.localKey]).filter(Boolean))];
    if (!keys.length) continue;
    const { rows: relatedRows } = await pool.query(
      `SELECT * FROM ${ident(relation.table)} WHERE ${ident(relation.remoteKey)} = ANY($1::uuid[])`,
      [keys]
    );
    if (relation.many) {
      for (const row of output) {
        row[relation.alias] = relatedRows.filter((related) => related[relation.remoteKey] === row[relation.localKey]);
      }
    } else {
      const byId = new Map(relatedRows.map((related) => [related[relation.remoteKey], related]));
      for (const row of output) row[relation.alias] = byId.get(row[relation.localKey]) || null;
    }
  }
  return output;
}

function ident(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function sendPgError(res, error) {
  console.error(error);
  const status = error.status || (error.code === '23505' ? 409 : 500);
  res.status(status).json({ error: error.message || 'Database error', code: error.code });
}
