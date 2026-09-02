import express from 'express';
import cors from 'cors';
import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import bcrypt from 'bcrypt'

// Return CLOBs as strings so API responses retain the former TEXT behavior.
oracledb.fetchAsString = [oracledb.CLOB];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors())

const PORT = process.env.PORT || 3001;


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|octet-stream/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image and document files are allowed (PDF, JPG, PNG, DOC, DOCX, XLS)'));
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Oracle Database Configuration. Do not put credentials in source control.
const dbConfig = {
  user: process.env.ORACLE_DB_USER,
  password: process.env.ORACLE_DB_PASSWORD,
  connectString: process.env.ORACLE_DB_CONNECT_STRING,
  poolMin: Number(process.env.ORACLE_POOL_MIN || 1),
  poolMax: Number(process.env.ORACLE_POOL_MAX || 10),
  poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT || 1)
};

let pool;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const RESULT_FIELD_NAMES = [
  'id', 'cabinNumber', 'status', 'tariff', 'daily_rate', 'floor', 'cabin_type', 'createdAt', 'updatedAt',
  'username', 'email', 'password', 'role', 'name', 'description', 'designation', 'department', 'maxDiscountPercent', 'isActive',
  'bodyNumber', 'bodyType', 'hospitalNumber', 'patientName', 'gender', 'age', 'locality', 'dateOfDeath', 'timeOfDeath', 'declaredBy', 'reasonOfDeath', 'deathIntimationNo', 'mlcNo', 'estimatedDaysOfStay',
  'witness1Name', 'witness1Address', 'witness1Contact', 'witness2Name', 'witness2Address', 'witness2Contact', 'billing_status', 'bodyId', 'cabinId', 'admissionDateTime', 'releaseDateTime', 'estimatedReleaseDateTime',
  'advanceAmount', 'hourlyRate', 'minHours', 'freeHours', 'cabinAllocationId', 'totalAmount', 'discountAmount', 'discountReason', 'concessionAuthorityId', 'netAmount', 'servicesAmount', 'settledAt', 'serviceId', 'serviceName', 'amount',
  'service_name', 'serviceAmount', 'releaseType', 'takenBy', 'relationship', 'address', 'contactNumber', 'policeStation', 'siName', 'nocDocument', 'legalDocuments', 'assignedTo', 'first_day_charge', 'hourly_charge_after_24hrs', 'updated_by', 'updated_at',
  'firstDayCharge', 'extraHours', 'additionalHourCharges', 'totalHours', 'staffConcession', 'staffName', 'staffEmployeeId', 'staffAddress', 'staffPhone', 'staffRelation',
  'policeStationName', 'stationSiName', 'presentPoliceOfficerName', 'nocCertificateUrl', 'freezerRequired', 'bodyReleasedAt', 'durationHours', 'count', 'sum',
  'full_name', 'employee_id', 'phone1', 'phone2', 'approval_status', 'admin_remarks', 'created_at',
  'releaseId', 'releaseCreatedAt', 'bodyRegisteredAt', 'billingId', 'stayTotalAmount', 'stayDiscountAmount',
  'stayNetAmount', 'stayBillStatus', 'serviceBillId', 'serviceNetAmount', 'serviceBillStatus',
  'fileName', 'fileUrl'
];
const resultFieldMap = new Map(RESULT_FIELD_NAMES.map((name) => [name.toUpperCase(), name]));

function oracleSql(sql) {
  let bindIndex = 0;
  return sql
    .replace(/\?/g, () => `:${++bindIndex}`)
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bCURDATE\(\)/gi, 'TRUNC(CURRENT_DATE)')
    .replace(/DATE\(([^)]+)\)/gi, 'TRUNC($1)')
    .replace(/TIMESTAMPDIFF\(HOUR,\s*([^,]+),\s*COALESCE\(([^,]+),\s*CURRENT_TIMESTAMP\)\)/gi, 'FLOOR((CAST(COALESCE($2, CURRENT_TIMESTAMP) AS DATE) - CAST($1 AS DATE)) * 24)')
    .replace(/FIELD\(([^,]+),\s*'pending',\s*'approved',\s*'rejected'\)/gi, "CASE $1 WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 ELSE 4 END")
    .replace(/\s+LIMIT\s+(\d+)\b/gi, ' FETCH FIRST $1 ROWS ONLY');
}

function oracleParams(params) {
  return params.map((value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/.test(value)) {
      return new Date(value.replace(' ', 'T'));
    }
    return value;
  });
}

function normalizeRows(result) {
  return (result.rows || []).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [resultFieldMap.get(key) || key.toLowerCase(), value])));
}

async function execute(sql, params = [], options = {}) {
  const connection = await pool.getConnection();
  try {
    return await connection.execute(oracleSql(sql), oracleParams(params), { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true, ...options });
  } finally {
    await connection.close();
  }
}

// Initialize the application-owned Oracle schema. The externally owned users table is intentionally not created here.
async function initDatabase() {
  try {
    if (!dbConfig.user || !dbConfig.password || !dbConfig.connectString) {
      throw new Error('ORACLE_DB_USER, ORACLE_DB_PASSWORD, and ORACLE_DB_CONNECT_STRING are required');
    }
    pool = await oracledb.createPool(dbConfig);
    const schema = fs.readFileSync(path.join(__dirname, 'oracle-schema.sql'), 'utf8');
    for (const statement of schema.split(/^\/\s*$/m).map((item) => item.trim()).filter(Boolean)) {
      await execute(statement);
    }

    if ((await queryOne('SELECT COUNT(*) AS count FROM system_settings')).count === 0) {
      await runQuery('INSERT INTO system_settings (id, first_day_charge, hourly_charge_after_24hrs, updated_by) VALUES (?, ?, ?, ?)', [uuidv4(), 2100, 130, 'System']);
    }
    if ((await queryOne('SELECT COUNT(*) AS count FROM cabins')).count === 0) {
      for (let i = 1; i <= 10; i++) {
        await runQuery('INSERT INTO cabins (id, cabinNumber, status, tariff) VALUES (?, ?, ?, ?)', [uuidv4(), `CAB-${i.toString().padStart(3, '0')}`, 'Available', 500]);
      }
    }
    if ((await queryOne('SELECT COUNT(*) AS count FROM body_types')).count === 0) {
      await runQuery('INSERT INTO body_types (id, name, description) VALUES (?, ?, ?)', [uuidv4(), 'MLC', 'Medico-Legal Case']);
      await runQuery('INSERT INTO body_types (id, name, description) VALUES (?, ?, ?)', [uuidv4(), 'Non-MLC', 'Non-Medico-Legal Case']);
    }
    if ((await queryOne('SELECT COUNT(*) AS count FROM mortuary_service_master')).count === 0) {
      await runQuery('INSERT INTO mortuary_service_master (id, service_name, tariff) VALUES (?, ?, ?)', [uuidv4(), 'Body Dressing', 500]);
    }
    console.log('Oracle application schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Helper function to get all results
async function queryAll(sql, params = []) {
  return normalizeRows(await execute(sql, params));
}

// Helper function to get single result
async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

// Helper function to run INSERT/UPDATE/DELETE
async function runQuery(sql, params = []) {
  return execute(sql, params);
}

// Generate body number
async function generateBodyNumber() {
  try {
    const year = new Date().getFullYear();
    const prefix = `MOSC-${year}-`;

    // Get all body numbers for this year and find the highest number
    const bodies = await queryAll("SELECT bodyNumber FROM bodies WHERE bodyNumber LIKE ?", [`${prefix}%`]);

    let maxNum = 0;
    for (const body of bodies) {
      const numStr = body.bodyNumber.replace(prefix, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating body number:', error);
    throw new Error('Failed to generate body number: ' + error.message);
  }
}

// ============ CABIN MASTER ROUTES ============
app.get('/api/cabins', async (req, res) => {
  try {
    const cabins = await queryAll('SELECT * FROM cabins ORDER BY cabinNumber');
    res.json(cabins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cabins', async (req, res) => {
  try {
    const { cabinNumber, tariff, floor, cabinType, dailyRate } = req.body;
    const id = uuidv4();
    const resolvedType = cabinType === 'FREEZER' ? 'FREEZER' : 'NORMAL_CABIN';
    const resolvedDailyRate = parseFloat(dailyRate) || parseFloat(tariff) || 500;
    await runQuery('INSERT INTO cabins (id, cabinNumber, tariff, daily_rate, floor, cabin_type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, cabinNumber, tariff || 500, resolvedDailyRate, floor || 1, resolvedType]);
    const cabin = await queryOne('SELECT * FROM cabins WHERE id = ?', [id]);
    res.json(cabin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cabins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cabinNumber, status, tariff, floor, cabinType, dailyRate } = req.body;
    const resolvedType = cabinType === 'FREEZER' ? 'FREEZER' : 'NORMAL_CABIN';
    const resolvedDailyRate = parseFloat(dailyRate) || parseFloat(tariff) || 500;
    await runQuery('UPDATE cabins SET cabinNumber = ?, status = ?, tariff = ?, daily_rate = ?, floor = ?, cabin_type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [cabinNumber, status, tariff, resolvedDailyRate, floor, resolvedType, id]);
    const cabin = await queryOne('SELECT * FROM cabins WHERE id = ?', [id]);
    res.json(cabin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cabins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('UPDATE cabins SET status = ? WHERE id = ?', ['Deactivated', id]);
    res.json({ message: 'Cabin deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BODY TYPE ROUTES ============
app.get('/api/body-types', async (req, res) => {
  try {
    const types = await queryAll('SELECT * FROM body_types');
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONCESSION AUTHORITY ROUTES ============
app.get('/api/concession-authorities', async (req, res) => {
  try {
    const authorities = await queryAll('SELECT * FROM concession_authorities WHERE isActive = 1');
    res.json(authorities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/concession-authorities', async (req, res) => {
  try {
    const { name, designation, department, maxDiscountPercent } = req.body;
    const id = uuidv4();
    await runQuery('INSERT INTO concession_authorities (id, name, designation, department, maxDiscountPercent) VALUES (?, ?, ?, ?, ?)',
      [id, name, designation, department, maxDiscountPercent || 100]);
    const authority = await queryOne('SELECT * FROM concession_authorities WHERE id = ?', [id]);
    res.json(authority);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/concession-authorities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('UPDATE concession_authorities SET isActive = 0 WHERE id = ?', [id]);
    res.json({ message: 'Concession authority deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
});

// ============ BODY REGISTRATION ROUTES ============
app.get('/api/bodies', async (req, res) => {
  try {
    const { status, bodyType, search } = req.query;
    let query = 'SELECT * FROM bodies WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (bodyType) {
      query += ' AND bodyType = ?';
      params.push(bodyType);
    }
    if (search) {
      query += ' AND (patientName LIKE ? OR bodyNumber LIKE ? OR hospitalNumber LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC';
    const bodies = await queryAll(query, params);

    // For each body, get allocation info if exists
    for (const body of bodies) {
      const allocation = await queryOne(`
        SELECT ca.*, c.cabinNumber
        FROM cabin_allocations ca
        JOIN cabins c ON ca.cabinId = c.id
        WHERE ca.bodyId = ?
        ORDER BY ca.createdAt DESC
        LIMIT 1
      `, [body.id]);
      body.allocation = allocation;
    }

    res.json(bodies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bodies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = await queryOne('SELECT * FROM bodies WHERE id = ?', [id]);
    if (!body) {
      return res.status(404).json({ error: 'Body not found' });
    }

    // Get the most recent allocation (regardless of status)
    const allocation = await queryOne(`
      SELECT ca.*, c.cabinNumber
      FROM cabin_allocations ca
      JOIN cabins c ON ca.cabinId = c.id
      WHERE ca.bodyId = ?
      ORDER BY ca.createdAt DESC
      LIMIT 1
    `, [id]);

    const billing = await queryOne('SELECT * FROM billing WHERE bodyId = ?', [id]);

    res.json({ ...body, allocation, billing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the most recent allocation for a body (for billing calculation)
app.get('/api/bodies/:id/allocation', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await queryOne(`
      SELECT ca.*, c.cabinNumber
      FROM cabin_allocations ca
      JOIN cabins c ON ca.cabinId = c.id
      WHERE ca.bodyId = ?
      ORDER BY ca.createdAt DESC
      LIMIT 1
    `, [id]);

    if (!allocation) {
      return res.status(404).json({ error: 'No allocation found for this body' });
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOC file upload endpoint
app.post('/api/upload/noc', upload.single('noc'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bodies/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await queryAll('SELECT * FROM body_documents WHERE bodyId = ? ORDER BY createdAt DESC', [id]);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching body documents:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bodies', async (req, res) => {
  try {
    console.log('Received body registration request:', req.body);

    const {
      bodyType, hospitalNumber, patientName, gender, age, locality,
      dateOfDeath, timeOfDeath, declaredBy, reasonOfDeath, deathIntimationNo, mlcNo,
      estimatedDaysOfStay, witness1Name, witness1Address, witness1Contact,
      witness2Name, witness2Address, witness2Contact,
      // MLC-specific fields
      policeStationName, stationSiName, presentPoliceOfficerName, nocCertificateUrl, freezerRequired
    } = req.body;

    // Validate MLC mandatory fields
    if (bodyType === 'MLC') {
      if (!policeStationName || !stationSiName || !presentPoliceOfficerName) {
        return res.status(400).json({ error: 'Police Station Name, SI Name, and Officer Name are mandatory for MLC cases.' });
      }
    }

    const id = uuidv4();
    const bodyNumber = await generateBodyNumber();
    console.log('Generated body number:', bodyNumber);

    // freezerRequired defaults to 1 (true) for MLC, null for non-MLC
    const freezerReqValue = bodyType === 'MLC' ? (freezerRequired === false || freezerRequired === 0 || freezerRequired === '0' || freezerRequired === 'false' ? 0 : 1) : null;

    const sql = `
      INSERT INTO bodies (
        id, bodyNumber, bodyType, hospitalNumber, patientName, gender, age, locality,
        dateOfDeath, timeOfDeath, declaredBy, reasonOfDeath, deathIntimationNo, mlcNo,
        estimatedDaysOfStay, witness1Name, witness1Address, witness1Contact,
        witness2Name, witness2Address, witness2Contact,
        policeStationName, stationSiName, presentPoliceOfficerName, nocCertificateUrl, freezerRequired
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id, bodyNumber, bodyType, hospitalNumber, patientName, gender, age, locality,
      dateOfDeath, timeOfDeath, declaredBy, reasonOfDeath, deathIntimationNo, mlcNo,
      estimatedDaysOfStay, witness1Name, witness1Address, witness1Contact,
      witness2Name, witness2Address, witness2Contact,
      policeStationName || null, stationSiName || null, presentPoliceOfficerName || null,
      nocCertificateUrl || null, freezerReqValue
    ];

    console.log('Executing SQL:', sql);
    console.log('With params:', params);

    await runQuery(sql, params);
    console.log('Insert successful');

    // Handle documents if present
    if (req.body.documents && Array.isArray(req.body.documents)) {
      for (const doc of req.body.documents) {
        const fileUrl = doc.fileUrl || doc.path || doc.url;
        const fileName = doc.fileName || doc.originalName || doc.filename || 'Document';
        if (fileUrl) {
          await runQuery(
            'INSERT INTO body_documents (id, bodyId, fileName, fileUrl) VALUES (?, ?, ?, ?)',
            [uuidv4(), id, fileName, fileUrl]
          );
        }
      }
    }

    const body = await queryOne('SELECT * FROM bodies WHERE id = ?', [id]);
    console.log('Retrieved body:', body);
    res.json(body);
  } catch (error) {
    console.error('Error registering body:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.put('/api/bodies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const allowedColumns = [
      'bodyType', 'hospitalNumber', 'patientName', 'gender', 'age', 'locality',
      'dateOfDeath', 'timeOfDeath', 'declaredBy', 'reasonOfDeath', 'deathIntimationNo',
      'mlcNo', 'estimatedDaysOfStay', 'witness1Name', 'witness1Address', 'witness1Contact',
      'witness2Name', 'witness2Address', 'witness2Contact', 'billing_status', 'status',
      'policeStationName', 'stationSiName', 'presentPoliceOfficerName', 'nocCertificateUrl',
      'freezerRequired'
    ];

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedColumns.includes(key)) {
        let cleanValue = value;
        if (key === 'freezerRequired') {
          const bodyType = fields.bodyType || 'Non-MLC';
          cleanValue = bodyType === 'MLC' ? (value === false || value === 0 || value === '0' || value === 'false' ? 0 : 1) : null;
        }
        setClauses.push(`${key} = ?`);
        values.push(cleanValue !== undefined ? cleanValue : null);
      }
    }

    if (setClauses.length > 0) {
      setClauses.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id);
      await runQuery(`UPDATE bodies SET ${setClauses.join(', ')} WHERE id = ?`, values);
    }

    // Handle documents cleanly
    if (fields.documents && Array.isArray(fields.documents)) {
      await runQuery('DELETE FROM body_documents WHERE bodyId = ?', [id]);
      for (const doc of fields.documents) {
        const fileUrl = doc.fileUrl || doc.path || doc.url;
        const fileName = doc.fileName || doc.originalName || doc.filename || 'Document';
        if (fileUrl) {
          await runQuery(
            'INSERT INTO body_documents (id, bodyId, fileName, fileUrl) VALUES (?, ?, ?, ?)',
            [uuidv4(), id, fileName, fileUrl]
          );
        }
      }
    }

    const body = await queryOne('SELECT * FROM bodies WHERE id = ?', [id]);
    res.json(body);
  } catch (error) {
    console.error('Error updating body:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bodies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Body ID is required' });
    }

    // Check if body exists
    const body = await queryOne(
      'SELECT id FROM bodies WHERE id = ? LIMIT 1',
      [id]
    );

    if (!body) {
      return res.status(404).json({ error: 'Body not found' });
    }

    // Check for active allocation
    const allocation = await queryOne(
      'SELECT id FROM cabin_allocations WHERE bodyId = ? LIMIT 1',
      [id]
    );

    if (allocation) {
      return res.status(400).json({
        error: 'Cannot delete body with active allocations. Please release the cabin first.'
      });
    }

    // Delete body
    const result = await runQuery(
      'DELETE FROM bodies WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Delete failed' });
    }

    res.json({ message: 'Body deleted successfully' });

  } catch (error) {
    console.error('DELETE BODY ERROR:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ============ MLC REGISTRATION DOCUMENT ROUTE ============
app.get('/api/mlc-registration/:bodyId', async (req, res) => {
  try {
    const { bodyId } = req.params;

    const body = await queryOne('SELECT * FROM bodies WHERE id = ?', [bodyId]);
    if (!body) {
      return res.status(404).json({ error: 'Body not found' });
    }
    if (body.bodyType !== 'MLC') {
      return res.status(400).json({ error: 'This body is not an MLC case. MLC registration document is only available for MLC bodies.' });
    }

    res.json({
      id: body.id,
      bodyNumber: body.bodyNumber,
      bodyType: body.bodyType,
      hospitalNumber: body.hospitalNumber,
      patientName: body.patientName,
      gender: body.gender,
      age: body.age,
      locality: body.locality,
      dateOfDeath: body.dateOfDeath,
      timeOfDeath: body.timeOfDeath,
      declaredBy: body.declaredBy,
      reasonOfDeath: body.reasonOfDeath,
      deathIntimationNo: body.deathIntimationNo,
      mlcNo: body.mlcNo,
      // MLC-specific
      policeStationName: body.policeStationName,
      stationSiName: body.stationSiName,
      presentPoliceOfficerName: body.presentPoliceOfficerName,
      nocCertificateUrl: body.nocCertificateUrl,
      freezerRequired: body.freezerRequired,
      // Witnesses
      witness1Name: body.witness1Name,
      witness1Address: body.witness1Address,
      witness1Contact: body.witness1Contact,
      witness2Name: body.witness2Name,
      witness2Address: body.witness2Address,
      witness2Contact: body.witness2Contact,
      // Timestamps
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
      status: body.status
    });
  } catch (error) {
    console.error('MLC REGISTRATION ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ CABIN ALLOCATION ROUTES ============
app.post('/api/cabin-allocations', async (req, res) => {
  try {
    console.log('Cabin allocation request received:', req.body);

    const { bodyId, cabinId, advanceAmount } = req.body;

    if (!bodyId || !cabinId) {
      return res.status(400).json({ error: 'bodyId and cabinId are required' });
    }

    // Get current billing settings for validation
    const settings = await queryOne('SELECT first_day_charge FROM system_settings LIMIT 1');
    const firstDayCharge = settings ? Number(settings.first_day_charge) : 2100;

    const parsedAdvance = parseFloat(advanceAmount);
    if (isNaN(parsedAdvance) || parsedAdvance < firstDayCharge) {
      return res.status(400).json({ error: `Advance collection is mandatory and must be at least ₹${firstDayCharge}` });
    }

    // Prevent duplicate allocation
    const existing = await queryOne(
      'SELECT * FROM cabin_allocations WHERE bodyId = ? AND status = ?',
      [bodyId, 'Allocated']
    );

    if (existing) {
      return res.status(400).json({ error: 'Body already has an active cabin allocation' });
    }

    // MLC freezer check: if the body is MLC and freezer is NOT required, block allocation
    const bodyRecord = await queryOne('SELECT bodyType, freezerRequired FROM bodies WHERE id = ?', [bodyId]);
    if (bodyRecord && bodyRecord.bodyType === 'MLC' && bodyRecord.freezerRequired === 0) {
      return res.status(400).json({
        error: 'This MLC case does not require a freezer. Cabin allocation, billing, and body release workflow is not applicable.'
      });
    }

    // Get cabin details for reference
    const cabin = await queryOne('SELECT * FROM cabins WHERE id = ?', [cabinId]);
    const resolvedDailyRate = firstDayCharge;

    // Get body details for estimated stay
    const body = await queryOne('SELECT * FROM bodies WHERE id = ?', [bodyId]);
    const estimatedDaysOfStay = body?.estimatedDaysOfStay || 7;

    // ---------- DATE LOGIC ----------
    const admissionDateTime = new Date();

    const estimatedReleaseDateTime = new Date(admissionDateTime);
    estimatedReleaseDateTime.setDate(
      estimatedReleaseDateTime.getDate() + estimatedDaysOfStay
    );

    // ---------- FORMAT FUNCTION ----------
    const formatOracleDateTime = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
    };

    const admissionStr = formatOracleDateTime(admissionDateTime);
    const estimatedStr = formatOracleDateTime(estimatedReleaseDateTime);

    console.log('Admission:', admissionStr);
    console.log('Estimated release:', estimatedStr);
    console.log('Daily rate:', resolvedDailyRate);

    const id = uuidv4();

    // ---------- INSERT ----------
    await runQuery(`
      INSERT INTO cabin_allocations
      (id, bodyId, cabinId, admissionDateTime, advanceAmount, hourlyRate, minHours, freeHours, estimatedReleaseDateTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      bodyId,
      cabinId,
      admissionStr,
      advanceAmount || 0,
      resolvedDailyRate,   // repurpose hourlyRate column to store daily_rate
      1,                   // minHours = 1 (not used in daily billing)
      0,                   // freeHours = 0
      estimatedStr
    ]);

    // Update related tables
    await runQuery('UPDATE cabins SET status = ? WHERE id = ?', ['Occupied', cabinId]);
    await runQuery('UPDATE bodies SET status = ? WHERE id = ?', ['Allocated', bodyId]);

    const allocation = await queryOne(`
      SELECT ca.*, c.cabinNumber, b.patientName, b.bodyNumber
      FROM cabin_allocations ca
      JOIN cabins c ON ca.cabinId = c.id
      JOIN bodies b ON ca.bodyId = b.id
      WHERE ca.id = ?
    `, [id]);

    res.json(allocation);

  } catch (error) {
    console.error('Error allocating cabin:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cabin-allocations', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ca.*, c.cabinNumber, c.status as cabinStatus, b.patientName, b.bodyNumber, b.bodyType
      FROM cabin_allocations ca
      JOIN cabins c ON ca.cabinId = c.id
      JOIN bodies b ON ca.bodyId = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND ca.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ca.createdAt DESC';
    const allocations = await queryAll(query, params);
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cabin-allocations/:id/release', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await queryOne(
      'SELECT * FROM cabin_allocations WHERE id = ?',
      [id]
    );

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    const body = await queryOne('SELECT billing_status FROM bodies WHERE id = ?', [allocation.bodyId]);
    if (!body || body.billing_status !== 'SETTLED') {
      return res.status(400).json({
        error: 'Bill must be settled before release'
      });
    }

    const now = new Date();

    const formatOracleDateTime = (date) => {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
    };

    const releaseDateTime = formatOracleDateTime(now);

    // ONLY update cabin_allocations status, actual release time and cabin/body status
    // happens in POST /api/body-releases.
    await runQuery(
      'UPDATE cabin_allocations SET status = ? WHERE id = ?',
      ['Released', id]
    );

    /*
    REMOVED PREMATURE UPDATES:
    await runQuery('UPDATE cabin_allocations SET releaseDateTime = NOW() WHERE id = ?', [id]);
    await runQuery('UPDATE cabins SET status = ? WHERE id = ?', ['NEEDS_CLEANING', allocation.cabinId]);
    await runQuery('UPDATE bodies SET status = ? WHERE id = ?', ['Ready for Release', allocation.bodyId]);
    */

    res.json({ message: 'Marked as released successfully (pending final body release form)', releaseDateTime });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extend/update release date/time for an allocation
app.put('/api/cabin-allocations/:id/extend', async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedReleaseDateTime } = req.body;

    const allocation = await queryOne('SELECT * FROM cabin_allocations WHERE id = ?', [id]);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Convert ISO datetime to a JavaScript Date-compatible timestamp string if needed.
    let oracleDateTime = expectedReleaseDateTime;
    if (expectedReleaseDateTime && expectedReleaseDateTime.includes('T')) {
      const date = new Date(expectedReleaseDateTime);
      oracleDateTime = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
    }

    await runQuery('UPDATE cabin_allocations SET releaseDateTime = ? WHERE id = ?', [oracleDateTime, id]);

    res.json({ message: 'Release date updated successfully', releaseDateTime: oracleDateTime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cabin-allocations/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await queryOne('SELECT * FROM cabin_allocations WHERE id = ?', [id]);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Get current rates from settings
    const settings = await queryOne('SELECT first_day_charge, hourly_charge_after_24hrs FROM system_settings LIMIT 1');
    const firstDayCharge = settings ? Number(settings.first_day_charge) : 2100;
    const hourlyRate = settings ? Number(settings.hourly_charge_after_24hrs) : 130;

    const admissionDate = new Date(allocation.admissionDateTime);
    // Use releaseDateTime if present, otherwise current time
    const endDate = allocation.releaseDateTime ? new Date(allocation.releaseDateTime) : new Date();

    const diffMs = endDate - admissionDate;
    // Round up stay duration to next full hour, minimum 1 hour
    const totalHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

    let extraHours = 0;
    let additionalHourCharges = 0;
    let totalAmount = 0;

    if (totalHours <= 24) {
      totalAmount = firstDayCharge;
    } else {
      extraHours = totalHours - 24;
      additionalHourCharges = extraHours * hourlyRate;
      totalAmount = firstDayCharge + additionalHourCharges;
    }

    const advance = Number(allocation.advanceAmount) || 0;
    const finalAmount = Math.max(0, totalAmount - advance);

    res.json({
      admissionDateTime: allocation.admissionDateTime,
      currentDateTime: endDate.toISOString(),
      totalHours,
      firstDayCharge,
      extraHours,
      hourlyRate,
      additionalHourCharges,
      totalAmount: totalAmount.toFixed(2),
      advanceAmount: advance,
      finalAmount: finalAmount.toFixed(2),
      // Fallback fields for backwards compatibility
      days: Math.ceil(totalHours / 24),
      dailyRate: firstDayCharge
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BILLING ROUTES ============
app.get('/api/billing', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, bo.patientName, bo.bodyNumber, bo.bodyType, bo.status as bodyStatus
      FROM billing b
      JOIN bodies bo ON b.bodyId = bo.id
      WHERE bo.status != 'RELEASED'
    `;
    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.createdAt DESC';
    const bills = await queryAll(query, params);

    // Fetch or synthesize service bills
    for (const bill of bills) {
      let svcBill = await queryOne('SELECT * FROM service_billing WHERE billingId = ?', [bill.id]);
      if (!svcBill) {
        // Fallback for legacy records
        const services = await queryAll('SELECT * FROM billing_services WHERE billingId = ?', [bill.id]);
        if (services.length > 0) {
          const charge = services.reduce((sum, s) => sum + Number(s.amount), 0);
          svcBill = {
            id: 'legacy-' + bill.id,
            bodyId: bill.bodyId,
            billingId: bill.id,
            serviceName: services[0].serviceName,
            serviceAmount: charge,
            discountAmount: 0,
            netAmount: charge,
            status: bill.status,
            createdAt: bill.createdAt
          };
        }
      }
      bill.serviceBill = svcBill;
    }

    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full billing details for print — fetches everything needed
app.get('/api/billing/:id/full', async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Billing ID:", id);

    const bill = await queryOne(`
      SELECT
        bi.id,
        bi.bodyId,
        bi.cabinAllocationId,
        bi.totalAmount,
        bi.discountAmount,
        bi.discountReason,
        bi.servicesAmount,
        bi.netAmount,
        bi.status,
        bi.settledAt,
        bi.createdAt AS billCreatedAt,
        bi.firstDayCharge,
        bi.extraHours,
        bi.hourlyRate,
        bi.additionalHourCharges,
        bi.totalHours,
        bi.advanceAmount,
        bi.staffConcession,
        bi.staffName,
        bi.staffEmployeeId,
        bi.staffAddress,
        bi.staffPhone,
        bi.staffRelation,
        bo.bodyNumber,
        bo.patientName,
        bo.bodyType,
        bo.hospitalNumber,
        bo.mlcNo,
        bo.createdAt AS admittedAt,
        bo.status AS bodyStatus,
        ca.admissionDateTime,
        c.cabinNumber,
        (SELECT br2.releaseDateTime FROM body_releases br2
         WHERE br2.bodyId = bo.id
         ORDER BY br2.releaseDateTime DESC LIMIT 1) AS bodyReleasedAt
      FROM billing bi
      JOIN bodies bo ON bi.bodyId = bo.id
      LEFT JOIN cabin_allocations ca ON bi.cabinAllocationId = ca.id
      LEFT JOIN cabins c ON ca.cabinId = c.id
      WHERE bi.id = ?
    `, [id]);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const services = await queryAll(
      'SELECT * FROM billing_services WHERE billingId = ? ORDER BY createdAt',
      [id]
    );

    let svcBill = await queryOne('SELECT * FROM service_billing WHERE billingId = ?', [id]);
    if (!svcBill && services.length > 0) {
      const charge = services.reduce((sum, s) => sum + Number(s.amount), 0);
      svcBill = {
        id: 'legacy-' + id,
        bodyId: bill.bodyId,
        billingId: id,
        serviceName: services[0].serviceName,
        serviceAmount: charge,
        discountAmount: 0,
        netAmount: charge,
        status: bill.status,
        createdAt: bill.billCreatedAt
      };
    }

    const finalData = { ...bill, services, serviceBill: svcBill };

    console.log("FINAL BILL:", finalData);

    res.json(finalData);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/billing/:bodyId', async (req, res) => {
  try {
    const { bodyId } = req.params;
    const billing = await queryOne('SELECT * FROM billing WHERE bodyId = ?', [bodyId]);

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    const services = await queryAll('SELECT * FROM billing_services WHERE billingId = ?', [billing.id]);
    res.json({ ...billing, services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing/generate', async (req, res) => {
  try {
    const {
      bodyId,
      cabinAllocationId,
      totalAmount,
      discountAmount,
      discountReason,
      concessionAuthorityId,
      firstDayCharge,
      extraHours,
      hourlyRate,
      additionalHourCharges,
      totalHours,
      advanceAmount,
      staffConcession,
      staffName,
      staffEmployeeId,
      staffAddress,
      staffPhone,
      staffRelation,
      bodyDressingRequired,
      bodyDressingCharge,
      serviceDiscountAmount
    } = req.body;

    console.log('=== BILLING GENERATE DEBUG ===');
    console.log('bodyDressingRequired:', bodyDressingRequired);
    console.log('bodyDressingCharge:', bodyDressingCharge);
    console.log('serviceDiscountAmount:', serviceDiscountAmount);
    console.log('Full req.body keys:', Object.keys(req.body));
    console.log('=============================');

    const id = uuidv4(); // Mortuary bill ID
    const isStaff = staffConcession === true || staffConcession === 1 || staffConcession === '1';

    // 1. Calculate Mortuary Stay Bill Net Amount
    let resolvedDiscountAmount = Number(discountAmount || 0);
    let resolvedNetAmount = 0;

    if (isStaff) {
      resolvedDiscountAmount = Number(totalAmount || 0);
      resolvedNetAmount = 0;
    } else {
      const resolvedAdvance = advanceAmount !== undefined ? Number(advanceAmount || 0) : 0;
      resolvedNetAmount = Math.max(0, Number(totalAmount || 0) - resolvedAdvance - resolvedDiscountAmount);
    }

    // Save Mortuary Bill into billing
    await runQuery(`
      INSERT INTO billing (
        id, bodyId, cabinAllocationId, totalAmount, discountAmount, discountReason, 
        concessionAuthorityId, servicesAmount, netAmount, status,
        firstDayCharge, extraHours, hourlyRate, additionalHourCharges, totalHours, advanceAmount,
        staffConcession, staffName, staffEmployeeId, staffAddress, staffPhone, staffRelation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, bodyId, cabinAllocationId, totalAmount, resolvedDiscountAmount, isStaff ? 'Staff Welfare Scheme - 100% Discount' : discountReason,
      isStaff ? null : concessionAuthorityId, 0, resolvedNetAmount, 'Pending',
      firstDayCharge !== undefined ? firstDayCharge : null,
      extraHours !== undefined ? extraHours : null,
      hourlyRate !== undefined ? hourlyRate : null,
      additionalHourCharges !== undefined ? additionalHourCharges : null,
      totalHours !== undefined ? totalHours : null,
      advanceAmount !== undefined ? advanceAmount : null,
      isStaff ? 1 : 0,
      isStaff ? staffName : null,
      isStaff ? staffEmployeeId : null,
      isStaff ? staffAddress : null,
      isStaff ? staffPhone : null,
      isStaff ? staffRelation : null
    ].map(p => p === undefined ? null : p));

    let serviceBillId = null;

    // 2. Save Service Bill into service_billing (only if selected)
    if (bodyDressingRequired) {
      serviceBillId = uuidv4();

      // Find serviceId and approved tariff from mortuary_service_master for 'Body Dressing'
      const dressingService = await queryOne("SELECT id, tariff FROM mortuary_service_master WHERE service_name LIKE '%dressing%' LIMIT 1");
      const serviceId = dressingService ? dressingService.id : null;
      const approvedTariff = dressingService ? Number(dressingService.tariff) : 500.00;

      const userRole = req.headers['x-user-role'] || '';
      let charge = parseFloat(bodyDressingCharge) || 0;

      // If user is not Admin, override with master tariff
      if (userRole !== 'Admin') {
        charge = approvedTariff;
      }

      const svcDiscount = 0; // No service discount under any circumstances
      const svcNetAmount = charge;

      await runQuery(`
        INSERT INTO service_billing (
          id, bodyId, billingId, serviceId, serviceName, serviceAmount, discountAmount, netAmount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        serviceBillId, bodyId, id, serviceId, 'Body Dressing', charge, svcDiscount, svcNetAmount, 'Pending'
      ]);

      // Also save to legacy billing_services table for backwards compatibility
      const legacySvcId = uuidv4();
      await runQuery(`
        INSERT INTO billing_services (id, billingId, serviceId, serviceName, amount)
        VALUES (?, ?, ?, ?, ?)
      `, [legacySvcId, id, serviceId, 'Body Dressing', charge]);
    }

    await runQuery('UPDATE bodies SET billing_status = ? WHERE id = ?', ['GENERATED', bodyId].map(p => p === undefined ? null : p));

    res.json({
      mortuaryBillId: id,
      serviceBillId: serviceBillId
    });

  } catch (error) {
    console.error('Error generating bills:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing/settle', async (req, res) => {
  try {
    const { id } = req.body;
    const billing = await queryOne('SELECT * FROM billing WHERE id = ?', [id]);

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    await runQuery('UPDATE billing SET status = ?, settledAt = CURRENT_TIMESTAMP WHERE id = ?', ['Settled', id]);

    // Check if service billing exists and is settled, or doesn't exist
    const svcBilling = await queryOne('SELECT * FROM service_billing WHERE bodyId = ?', [billing.bodyId]);
    if (!svcBilling || svcBilling.status === 'Settled') {
      await runQuery('UPDATE bodies SET billing_status = ? WHERE id = ?', ['SETTLED', billing.bodyId]);
    }

    const updatedBilling = await queryOne('SELECT * FROM billing WHERE id = ?', [id]);
    res.json(updatedBilling);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVICE BILLING ROUTES ============
app.get('/api/service-billing/:id/full', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a legacy ID (starts with "legacy-")
    if (id.startsWith('legacy-')) {
      const parentBillId = id.replace('legacy-', '');
      const bill = await queryOne(`
        SELECT
          bi.id,
          bi.bodyId,
          bi.cabinAllocationId,
          bi.totalAmount,
          bi.discountAmount,
          bi.discountReason,
          bi.servicesAmount,
          bi.netAmount,
          bi.status,
          bi.settledAt,
          bi.createdAt AS billCreatedAt,
          bi.firstDayCharge,
          bi.extraHours,
          bi.hourlyRate,
          bi.additionalHourCharges,
          bi.totalHours,
          bi.advanceAmount,
          bi.staffConcession,
          bi.staffName,
          bi.staffEmployeeId,
          bi.staffAddress,
          bi.staffPhone,
          bi.staffRelation,
          bo.bodyNumber,
          bo.patientName,
          bo.bodyType,
          bo.hospitalNumber,
          bo.mlcNo,
          bo.createdAt AS admittedAt,
          bo.status AS bodyStatus,
          ca.admissionDateTime,
          c.cabinNumber,
          (SELECT br2.releaseDateTime FROM body_releases br2
           WHERE br2.bodyId = bo.id
           ORDER BY br2.releaseDateTime DESC LIMIT 1) AS bodyReleasedAt
        FROM billing bi
        JOIN bodies bo ON bi.bodyId = bo.id
        LEFT JOIN cabin_allocations ca ON bi.cabinAllocationId = ca.id
        LEFT JOIN cabins c ON ca.cabinId = c.id
        WHERE bi.id = ?
      `, [parentBillId]);

      if (!bill) {
        return res.status(404).json({ error: 'Parent bill not found' });
      }

      const services = await queryAll(
        'SELECT * FROM billing_services WHERE billingId = ? ORDER BY createdAt',
        [parentBillId]
      );

      const charge = services.reduce((sum, s) => sum + Number(s.amount), 0);
      const resData = {
        id: id,
        bodyId: bill.bodyId,
        billingId: parentBillId,
        serviceId: services[0]?.serviceId || null,
        serviceName: services[0]?.serviceName || 'Body Dressing',
        serviceAmount: charge,
        discountAmount: 0,
        netAmount: charge,
        status: bill.status,
        createdAt: bill.billCreatedAt,
        bodyNumber: bill.bodyNumber,
        patientName: bill.patientName,
        bodyType: bill.bodyType,
        hospitalNumber: bill.hospitalNumber,
        mlcNo: bill.mlcNo,
        cabinNumber: bill.cabinNumber,
        admissionDateTime: bill.admissionDateTime,
        bodyReleasedAt: bill.bodyReleasedAt,
        staffConcession: bill.staffConcession,
        staffName: bill.staffName,
        staffEmployeeId: bill.staffEmployeeId,
        staffAddress: bill.staffAddress,
        staffPhone: bill.staffPhone,
        staffRelation: bill.staffRelation
      };

      return res.json(resData);
    }

    // Otherwise, fetch from service_billing
    const svcBill = await queryOne(`
      SELECT
        sb.*,
        bo.bodyNumber,
        bo.patientName,
        bo.bodyType,
        bo.hospitalNumber,
        bo.mlcNo,
        c.cabinNumber,
        ca.admissionDateTime,
        (SELECT br2.releaseDateTime FROM body_releases br2
         WHERE br2.bodyId = bo.id
         ORDER BY br2.releaseDateTime DESC LIMIT 1) AS bodyReleasedAt,
        bi.staffConcession,
        bi.staffName,
        bi.staffEmployeeId,
        bi.staffAddress,
        bi.staffPhone,
        bi.staffRelation
      FROM service_billing sb
      JOIN bodies bo ON sb.bodyId = bo.id
      LEFT JOIN billing bi ON sb.billingId = bi.id
      LEFT JOIN cabin_allocations ca ON bi.cabinAllocationId = ca.id
      LEFT JOIN cabins c ON ca.cabinId = c.id
      WHERE sb.id = ?
    `, [id]);

    if (!svcBill) {
      return res.status(404).json({ error: 'Service bill not found' });
    }

    res.json(svcBill);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/service-billing/settle', async (req, res) => {
  try {
    const { id } = req.body;

    // Check if it's a legacy ID
    if (id && id.startsWith('legacy-')) {
      const parentBillId = id.replace('legacy-', '');
      await runQuery("UPDATE billing SET status = 'Settled', settledAt = CURRENT_TIMESTAMP WHERE id = ?", [parentBillId]);
      const parentBill = await queryOne('SELECT bodyId FROM billing WHERE id = ?', [parentBillId]);
      if (parentBill) {
        await runQuery("UPDATE bodies SET billing_status = 'SETTLED' WHERE id = ?", [parentBill.bodyId]);
      }
      return res.json({ id, status: 'Settled' });
    }

    const svcBilling = await queryOne('SELECT * FROM service_billing WHERE id = ?', [id]);

    if (!svcBilling) {
      return res.status(404).json({ error: 'Service billing not found' });
    }

    await runQuery("UPDATE service_billing SET status = 'Settled' WHERE id = ?", [id]);

    // Check if mortuary bill is also settled
    const mortuaryBilling = await queryOne('SELECT * FROM billing WHERE bodyId = ?', [svcBilling.bodyId]);
    if (!mortuaryBilling || mortuaryBilling.status === 'Settled') {
      await runQuery("UPDATE bodies SET billing_status = 'SETTLED' WHERE id = ?", [svcBilling.bodyId]);
    }

    const updated = await queryOne('SELECT * FROM service_billing WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BODY RELEASE ROUTES ============
app.post('/api/body-releases', upload.fields([
  { name: 'nocFile', maxCount: 1 },
  { name: 'legalDocumentsFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { bodyId, caseType, bodyTakenBy, relationship, address, contactNumber, policeStationName, siName } = req.body;

    // 1. Verify stay charges bill is settled
    const invoice = await queryOne('SELECT * FROM billing WHERE bodyId = ?', [bodyId]);
    if (!invoice || invoice.status !== 'Settled') {
      return res.status(400).json({ error: 'Mortuary Stay Bill must be settled before release' });
    }

    // 2. Verify service bill (if exists) is settled
    const svcBill = await queryOne('SELECT * FROM service_billing WHERE bodyId = ?', [bodyId]);
    if (svcBill && svcBill.status !== 'Settled') {
      return res.status(400).json({ error: 'Body Dressing Service Bill must be settled before release' });
    }

    // 2. Verify body not already released
    const body = await queryOne('SELECT status FROM bodies WHERE id = ?', [bodyId]);
    if (body && body.status === 'RELEASED') {
      return res.status(400).json({ error: 'Body already released' });
    }

    // 3. Validate required fields
    if (caseType === 'NON_MLC' && (!bodyTakenBy || !relationship || !address || !contactNumber)) {
      const missing = !bodyTakenBy ? 'bodyTakenBy' : !relationship ? 'relationship' : !address ? 'address' : 'contactNumber';
      return res.status(422).json({ error: `Field ${missing} is required` });
    }
    if (caseType === 'MLC' && (!bodyTakenBy || !contactNumber || !policeStationName || !siName)) {
      const missing = !bodyTakenBy ? 'bodyTakenBy' : !contactNumber ? 'contactNumber' : !policeStationName ? 'policeStationName' : 'siName';
      return res.status(422).json({ error: `Field ${missing} is required` });
    }

    // 4. Save uploaded files
    // Store public URLs, not host-specific filesystem paths, so documents can
    // be opened from every client device.
    const nocCertificateUrl = req.files?.nocFile?.[0]
      ? `/uploads/${req.files.nocFile[0].filename}`
      : null;
    const legalDocumentsUrl = req.files?.legalDocumentsFile?.[0]
      ? `/uploads/${req.files.legalDocumentsFile[0].filename}`
      : null;

    // 5. INSERT into body_releases
    const id = uuidv4();
    await runQuery(`
      INSERT INTO body_releases (
        id, bodyId, releaseType, takenBy, relationship, address, contactNumber,
        policeStation, siName, nocDocument, legalDocuments, releaseDateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [id, bodyId, caseType || 'NON_MLC', bodyTakenBy, relationship || null, address || null, contactNumber, policeStationName || null, siName || null, nocCertificateUrl, legalDocumentsUrl]);

    // 6. UPDATE bodies
    await runQuery('UPDATE bodies SET status = ? WHERE id = ?', ['RELEASED', bodyId]);

    // 7. UPDATE cabins and 8. UPDATE allocations
    const allocation = await queryOne('SELECT cabinId FROM cabin_allocations WHERE bodyId = ? ORDER BY createdAt DESC LIMIT 1', [bodyId]);
    if (allocation) {
      // 1. Mark the cabin for cleaning instead of keeping it locked ('Occupied')
      await runQuery('UPDATE cabins SET status = ? WHERE id = ?', ['NEEDS_CLEANING', allocation.cabinId]);

      // 2. Automatically generate a pending housekeeping task
      const housekeepingTaskId = uuidv4();
      await runQuery(
        'INSERT INTO housekeeping_tasks (id, cabinId, status, createdAt) VALUES (?, ?, ?, NOW())',
        [housekeepingTaskId, allocation.cabinId, 'PENDING']
      );

      // (We don't need to force update releaseDateTime to NOW() here because calculate finalAmount already manages exact times if needed, but we can stamp it.)
      await runQuery('UPDATE cabin_allocations SET releaseDateTime = NOW() WHERE bodyId = ? AND status = ?', [bodyId, 'Allocated']);
    }

    // 9. Return 201
    res.status(201).json({ message: 'Body released successfully', releaseId: id });
  } catch (error) {
    console.error('Body release error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/body-releases/:bodyId', async (req, res) => {
  try {
    const { bodyId } = req.params;
    const release = await queryOne('SELECT * FROM body_releases WHERE bodyId = ? ORDER BY createdAt DESC LIMIT 1', [bodyId]);
    res.json(release || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RELEASE HISTORY ROUTES ============
app.get('/api/release-history', async (req, res) => {
  try {
    const records = await queryAll(`
      SELECT
        br.id AS releaseId,
        br.bodyId,
        br.releaseType,
        br.takenBy,
        br.relationship,
        br.address,
        br.contactNumber,
        br.policeStation,
        br.siName,
        br.nocDocument,
        br.legalDocuments,
        br.releaseDateTime,
        br.createdAt AS releaseCreatedAt,
        bo.bodyNumber,
        bo.patientName,
        bo.bodyType,
        bo.hospitalNumber,
        bo.mlcNo,
        bo.gender,
        bo.age,
        bo.createdAt AS bodyRegisteredAt,
        bi.id AS billingId,
        bi.totalAmount AS stayTotalAmount,
        bi.discountAmount AS stayDiscountAmount,
        bi.netAmount AS stayNetAmount,
        bi.status AS stayBillStatus,
        bi.staffConcession,
        bi.staffName,
        bi.staffEmployeeId,
        bi.staffRelation,
        bi.firstDayCharge,
        bi.extraHours,
        bi.hourlyRate,
        bi.additionalHourCharges,
        bi.totalHours,
        bi.advanceAmount,
        bi.discountReason,
        ca.admissionDateTime,
        c.cabinNumber,
        sb.id AS serviceBillId,
        sb.serviceName,
        sb.serviceAmount,
        sb.netAmount AS serviceNetAmount,
        sb.status AS serviceBillStatus
      FROM body_releases br
      JOIN bodies bo ON br.bodyId = bo.id
      LEFT JOIN billing bi ON bi.bodyId = bo.id
      LEFT JOIN (
        SELECT ca1.bodyId, ca1.cabinId, ca1.admissionDateTime,
               ROW_NUMBER() OVER (PARTITION BY ca1.bodyId ORDER BY ca1.createdAt DESC) as rn
        FROM cabin_allocations ca1
      ) ca ON ca.bodyId = bo.id AND ca.rn = 1
      LEFT JOIN cabins c ON ca.cabinId = c.id
      LEFT JOIN (
        SELECT sb1.id, sb1.bodyId, sb1.serviceName, sb1.serviceAmount, sb1.netAmount, sb1.status,
               ROW_NUMBER() OVER (PARTITION BY sb1.bodyId ORDER BY sb1.createdAt DESC) as rn
        FROM service_billing sb1
      ) sb ON sb.bodyId = bo.id AND sb.rn = 1
      ORDER BY br.releaseDateTime DESC
    `);
    res.json(records);
  } catch (error) {
    console.error('Release history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ HOUSEKEEPING ROUTES ============
app.get('/api/housekeeping/tasks', async (req, res) => {
  try {
    const query = `
      SELECT ht.*, c.cabinNumber
      FROM housekeeping_tasks ht
      JOIN cabins c ON ht.cabinId = c.id
      ORDER BY ht.createdAt DESC
    `;
    const tasks = await queryAll(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/assign', async (req, res) => {
  try {
    const { taskId, staffName } = req.body;
    await runQuery('UPDATE housekeeping_tasks SET assignedTo = ?, status = ? WHERE id = ?', [staffName, 'IN_PROGRESS', taskId]);
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/complete', async (req, res) => {
  try {
    const { taskId } = req.body;
    await runQuery('UPDATE housekeeping_tasks SET status = ? WHERE id = ?', ['COMPLETED', taskId]);
    res.json({ message: 'Task marked as completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/verify', async (req, res) => {
  try {
    const { taskId } = req.body;
    // 1. Mark task as Verified
    await runQuery('UPDATE housekeeping_tasks SET status = ? WHERE id = ?', ['VERIFIED', taskId]);

    // 2. Find the cabinId from the task
    const task = await queryOne('SELECT cabinId FROM housekeeping_tasks WHERE id = ?', [taskId]);

    if (task) {
      // 3. Complete the lifecycle - mark cabin as Available
      await runQuery('UPDATE cabins SET status = ? WHERE id = ?', ['Available', task.cabinId]);
    }

    res.json({ message: 'Cabin verified and is now available' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REPORTS ROUTES ============
app.get('/api/reports/cabin-occupancy', async (req, res) => {
  try {
    const { startDate, endDate, cabinNo, bodyType } = req.query;

    let query = `
      SELECT
        ca.*,
        c.cabinNumber,
        b.patientName,
        b.bodyNumber,
        b.bodyType,
        ca.admissionDateTime,
        ca.releaseDateTime,
        GREATEST(0, ROUND(
          (CAST(COALESCE(ca.releaseDateTime, CURRENT_TIMESTAMP) AS DATE)
            - CAST(ca.admissionDateTime AS DATE)) * 24,
          1
        )) AS durationHours
      FROM cabin_allocations ca
      JOIN cabins c ON ca.cabinId = c.id
      JOIN bodies b ON ca.bodyId = b.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) { query += ' AND ca.admissionDateTime >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND ca.admissionDateTime <= ?'; params.push(endDate.includes(' ') ? endDate : endDate + ' 23:59:59'); }
    if (cabinNo) { query += ' AND c.cabinNumber = ?'; params.push(cabinNo); }
    if (bodyType) { query += ' AND b.bodyType = ?'; params.push(bodyType); }

    query += ' ORDER BY ca.admissionDateTime DESC';
    const data = await queryAll(query, params);

    const summary = {
      totalAllocations: data.length,
      occupied: data.filter(d => !d.releaseDateTime).length,
      released: data.filter(d => d.releaseDateTime).length,
      mlcCases: data.filter(d => d.bodyType === 'MLC').length,
      nonMlcCases: data.filter(d => d.bodyType === 'Non-MLC').length
    };

    res.json({ data, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/invoice-analysis', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let query = `
      SELECT
        b.*,
        bo.patientName,
        bo.bodyNumber,
        bo.bodyType
      FROM billing b
      JOIN bodies bo ON b.bodyId = bo.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) { query += ' AND b.createdAt >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND b.createdAt <= ?'; params.push(endDate.includes(' ') ? endDate : endDate + ' 23:59:59'); }
    if (status) { query += ' AND b.status = ?'; params.push(status); }

    query += ' ORDER BY b.createdAt DESC';
    const data = await queryAll(query, params);

    const summary = {
      totalBills: data.length,
      totalAmount: data.reduce((sum, d) => sum + (d.totalAmount || 0), 0),
      totalDiscount: data.reduce((sum, d) => sum + (d.discountAmount || 0), 0),
      totalNetAmount: data.reduce((sum, d) => sum + (d.netAmount || 0), 0),
      settled: data.filter(d => d.status === 'Settled').length,
      pending: data.filter(d => d.status === 'Pending').length
    };

    res.json({ data, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/concession', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        b.id,
        b.discountAmount,
        b.discountReason,
        b.createdAt,
        bo.patientName,
        bo.bodyNumber,
        ca.name as authorityName,
        ca.designation
      FROM billing b
      JOIN bodies bo ON b.bodyId = bo.id
      LEFT JOIN concession_authorities ca ON b.concessionAuthorityId = ca.id
      WHERE b.discountAmount > 0
    `;
    const params = [];

    if (startDate) { query += ' AND b.createdAt >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND b.createdAt <= ?'; params.push(endDate.includes(' ') ? endDate : endDate + ' 23:59:59'); }

    query += ' ORDER BY b.createdAt DESC';
    const data = await queryAll(query, params);

    const summary = {
      totalConcessions: data.length,
      totalAmount: data.reduce((sum, d) => sum + (d.discountAmount || 0), 0)
    };

    res.json({ data, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD ROUTES ============
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalBodies = await queryOne('SELECT COUNT(*) as count FROM bodies');
    const activeAllocations = await queryOne("SELECT COUNT(*) as count FROM cabin_allocations WHERE status = 'Allocated'");

    const pendingMortuary = await queryOne("SELECT COUNT(*) as count FROM billing WHERE status = 'Pending'");
    const pendingService = await queryOne("SELECT COUNT(*) as count FROM service_billing WHERE status = 'Pending'");
    const pendingBillsCount = (pendingMortuary?.count || 0) + (pendingService?.count || 0);

    const releasedToday = await queryOne("SELECT COUNT(*) as count FROM body_releases WHERE DATE(releaseDateTime) = CURDATE()");
    const readyForRelease = await queryOne("SELECT COUNT(*) as count FROM bodies WHERE status = 'Ready for Release'");

    const cabinStats = await queryOne(`
      SELECT
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM cabins WHERE status != 'Deactivated'
    `);

    const recentBodies = await queryAll('SELECT * FROM bodies ORDER BY createdAt DESC LIMIT 5');

    // Revenue statistics
    const mortuaryRevenue = await queryOne("SELECT SUM(netAmount) as sum FROM billing WHERE status = 'Settled'");
    const serviceRevenue = await queryOne("SELECT SUM(netAmount) as sum FROM service_billing WHERE status = 'Settled'");
    const legacySvcRev = await queryOne(`
      SELECT SUM(servicesAmount) as sum 
      FROM billing 
      WHERE status = 'Settled' 
      AND id NOT IN (SELECT DISTINCT billingId FROM service_billing WHERE billingId IS NOT NULL)
    `);
    const totalServiceRevenue = Number(serviceRevenue?.sum || 0) + Number(legacySvcRev?.sum || 0);

    const mortuaryDiscounts = await queryOne("SELECT SUM(discountAmount) as sum FROM billing");
    const serviceDiscounts = await queryOne("SELECT SUM(discountAmount) as sum FROM service_billing");

    res.json({
      totalBodies: totalBodies?.count || 0,
      activeAllocations: activeAllocations?.count || 0,
      pendingBills: pendingBillsCount,
      releasedToday: releasedToday?.count || 0,
      readyForRelease: readyForRelease?.count || 0,
      cabins: cabinStats || { available: 0, occupied: 0, maintenance: 0 },
      recentBodies,
      mortuaryRevenue: Number(mortuaryRevenue?.sum || 0),
      serviceRevenue: totalServiceRevenue,
      bodyDressingRevenue: totalServiceRevenue,
      mortuaryDiscount: Number(mortuaryDiscounts?.sum || 0),
      serviceDiscount: Number(serviceDiscounts?.sum || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ FILE UPLOAD ROUTES ============
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Single file upload for documents
app.post('/api/upload/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get uploaded files list
app.get('/api/uploads', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    res.json({ files });
  } catch (error) {
    console.error('Error reading uploads:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ HOUSEKEEPING MODULE ROUTES ============

app.get('/api/housekeeping/tasks', async (req, res) => {
  try {
    const query = `
      SELECT ht.*, c.cabinNumber
      FROM housekeeping_tasks ht
      JOIN cabins c ON ht.cabinId = c.id
      ORDER BY ht.createdAt DESC
    `;
    const tasks = await queryAll(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/assign', async (req, res) => {
  try {
    const { taskId, staffName } = req.body;
    if (!taskId || !staffName) {
      return res.status(400).json({ error: 'taskId and staffName are required' });
    }

    await runQuery(
      "UPDATE housekeeping_tasks SET assignedTo = ?, status = 'IN_PROGRESS' WHERE id = ?",
      [staffName, taskId]
    );
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/complete', async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    await runQuery(
      "UPDATE housekeeping_tasks SET status = 'COMPLETED' WHERE id = ?",
      [taskId]
    );
    res.json({ message: 'Task marked as completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/housekeeping/verify', async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    // First get the cabinId
    const task = await queryOne('SELECT cabinId FROM housekeeping_tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Update the task status
    await runQuery(
      "UPDATE housekeeping_tasks SET status = 'VERIFIED' WHERE id = ?",
      [taskId]
    );

    // Change cabin status back to Available
    await runQuery(
      "UPDATE cabins SET status = 'Available' WHERE id = ?",
      [task.cabinId]
    );

    res.json({ message: 'Task verified and cabin is now Available' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVICE MASTER ROUTES ============
app.get('/api/services', async (req, res) => {
  try {
    const services = await queryAll('SELECT * FROM mortuary_service_master ORDER BY service_name');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only Admins can modify services.' });
    }
    const { service_name, tariff } = req.body;
    if (!service_name || tariff === undefined) {
      return res.status(400).json({ error: 'service_name and tariff are required' });
    }
    const id = uuidv4();
    await runQuery(
      'INSERT INTO mortuary_service_master (id, service_name, tariff) VALUES (?, ?, ?)',
      [id, service_name.trim(), parseFloat(tariff) || 0]
    );
    const service = await queryOne('SELECT * FROM mortuary_service_master WHERE id = ?', [id]);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only Admins can modify services.' });
    }
    const { id } = req.params;
    const { service_name, tariff } = req.body;
    if (!service_name || tariff === undefined) {
      return res.status(400).json({ error: 'service_name and tariff are required' });
    }
    await runQuery(
      'UPDATE mortuary_service_master SET service_name = ?, tariff = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [service_name.trim(), parseFloat(tariff) || 0, id]
    );
    const service = await queryOne('SELECT * FROM mortuary_service_master WHERE id = ?', [id]);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only Admins can modify services.' });
    }
    const { id } = req.params;
    await runQuery('DELETE FROM mortuary_service_master WHERE id = ?', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BILLING CONFIGURATION SETTINGS ROUTES ============
app.get('/api/billing-settings', async (req, res) => {
  try {
    const settings = await queryOne('SELECT * FROM system_settings LIMIT 1');
    if (!settings) {
      return res.json({
        first_day_charge: 2100.00,
        hourly_charge_after_24hrs: 130.00,
        updated_by: 'System',
        updated_at: new Date().toISOString()
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing-settings', async (req, res) => {
  try {
    const { first_day_charge, hourly_charge_after_24hrs, updated_by } = req.body;

    if (first_day_charge === undefined || hourly_charge_after_24hrs === undefined) {
      return res.status(400).json({ error: 'first_day_charge and hourly_charge_after_24hrs are required' });
    }

    const firstDay = parseFloat(first_day_charge);
    const hourly = parseFloat(hourly_charge_after_24hrs);

    if (isNaN(firstDay) || isNaN(hourly) || firstDay < 0 || hourly < 0) {
      return res.status(400).json({ error: 'Charges must be non-negative numbers' });
    }

    let settings = await queryOne('SELECT id FROM system_settings LIMIT 1');
    let id = settings ? settings.id : uuidv4();

    if (settings) {
      await runQuery(
        'UPDATE system_settings SET first_day_charge = ?, hourly_charge_after_24hrs = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [firstDay, hourly, updated_by || 'Admin', id]
      );
    } else {
      await runQuery(
        'INSERT INTO system_settings (id, first_day_charge, hourly_charge_after_24hrs, updated_by) VALUES (?, ?, ?, ?)',
        [id, firstDay, hourly, updated_by || 'Admin']
      );
    }

    const updatedSettings = await queryOne('SELECT * FROM system_settings WHERE id = ?', [id]);
    res.json({ message: 'Settings updated successfully', settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN USER MANAGEMENT ROUTES ============

// Middleware helper: verify caller is admin
function requireAdmin(req, res, next) {
  const role = req.headers['x-admin-role'];
  if (role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
}

// GET all users (for admin approval panel)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await queryAll(
      `SELECT id, full_name, employee_id, department, phone1, email, approval_status, admin_remarks, created_at 
       FROM mortuary_users
       ORDER BY
         FIELD(approval_status, 'pending', 'approved', 'rejected'),
         created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Admin users list error:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET single user details
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    const user = await queryOne(
      `SELECT id, full_name, employee_id, department, phone1, phone2, email, approval_status, admin_remarks, created_at 
       FROM mortuary_users WHERE id = ?`,
      [id]
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error('Admin user detail error:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST approve a user
app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    const user = await queryOne('SELECT id, approval_status FROM mortuary_users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await runQuery(
      `UPDATE mortuary_users SET approval_status = 'approved', admin_remarks = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    res.json({ message: 'User approved successfully.' });
  } catch (error) {
    console.error('Approve error:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST reject a user
app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    const remarks = req.body.remarks ? String(req.body.remarks).substring(0, 500) : null;

    const user = await queryOne('SELECT id FROM mortuary_users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await runQuery(
      `UPDATE mortuary_users SET approval_status = 'rejected', admin_remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [remarks || null, id]
    );
    res.json({ message: 'User rejected.' });
  } catch (error) {
    console.error('Reject error:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============ USER REGISTRATION ============
// Allowed department values (whitelist)
const ALLOWED_DEPARTMENTS = ['House Keeping', 'M Staff'];

app.post('/api/user_register', async (req, res) => {
  try {
    const { fullname, employee_id, department, phone1, phone2, email, password } = req.body;

    // --- Server-side field validation ---
    if (!fullname || typeof fullname !== 'string' || !fullname.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    if (!employee_id || typeof employee_id !== 'string' || !employee_id.trim()) {
      return res.status(400).json({ message: 'Employee ID is required.' });
    }
    if (!/^[A-Za-z0-9]+$/.test(employee_id.trim())) {
      return res.status(400).json({ message: 'Employee ID must be alphanumeric.' });
    }
    if (!department || !ALLOWED_DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Invalid department selected.' });
    }
    if (!phone1 || !/^[6-9]\d{9}$/.test(phone1.trim())) {
      return res.status(400).json({ message: 'Valid 10-digit phone number required.' });
    }
    if (phone2 && phone2.trim() && !/^[6-9]\d{9}$/.test(phone2.trim())) {
      return res.status(400).json({ message: 'Secondary phone number is invalid.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const cleanEmployeeId = employee_id.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullname = fullname.trim();
    const cleanPhone1 = phone1.trim();
    const cleanPhone2 = phone2 ? phone2.trim() : null;

    // --- Duplicate checks ---
    const existingByEmpId = await queryOne('SELECT id FROM mortuary_users WHERE employee_id = ?', [cleanEmployeeId]);
    if (existingByEmpId) {
      return res.status(400).json({ message: 'Employee ID is already registered.' });
    }
    const existingByEmail = await queryOne('SELECT id FROM mortuary_users WHERE email = ?', [cleanEmail]);
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email address is already registered.' });
    }

    // --- Hash password ---
    const hash = await bcrypt.hash(password, 12);

    // --- Insert with approval_status = 'pending' ---
    await runQuery(
      `INSERT INTO mortuary_users (full_name, employee_id, department, phone1, phone2, email, password, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [cleanFullname, cleanEmployeeId, department, cleanPhone1, cleanPhone2, cleanEmail, hash]
    );

    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.' });

  } catch (error) {
    console.error('Registration error:', error.code || error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Employee ID or email already registered.' });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ============ USER LOGIN ============
app.post('/api/login', async (req, res) => {
  try {
    let { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required.' });
    }

    // Basic sanitization
    employeeId = String(employeeId).trim();
    if (!/^[A-Za-z0-9]+$/.test(employeeId)) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = await queryOne('SELECT * FROM mortuary_users WHERE employee_id = ?', [employeeId]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- Approval status gate ---
    const status = user.approval_status || 'approved'; // backwards-compat: if column missing treat as approved
    if (status === 'pending') {
      return res.status(403).json({
        message: 'Your registration is pending admin approval. Please contact the admin.'
      });
    }
    if (status === 'rejected') {
      return res.status(403).json({
        message: 'Your registration has been rejected. Please contact the admin for further assistance.'
      });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullname: user.full_name,
        email: user.email,
        role: user.department
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
//admin login 
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required",
      });
    }

    const rows = await queryAll("SELECT * FROM admin WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Register
app.post("/api/admin/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const existing = await queryAll("SELECT id FROM admin WHERE username = ?", [username]);

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await runQuery("INSERT INTO admin (id, username, email, password) VALUES (?, ?, ?, ?)", [uuidv4(), username, email || null, hashedPassword]);

    res.json({
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Global error handling middleware (catches Multer errors cleanly)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer upload error:', err);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('Server error:', err);
    return res.status(400).json({ error: err.message || 'An error occurred during upload' });
  }
  next();
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mortuary Management System running on port ${PORT}`);
    console.log(`Connected to Oracle database: ${dbConfig.connectString}`);
    console.log(`Access on LAN: http://<SERVER_IP>:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

