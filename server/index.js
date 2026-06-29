require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('./db');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// --- SESSION MANAGEMENT ---
const sessions = new Map();
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const generateSessionId = () => crypto.randomBytes(32).toString('hex');

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_123');
    const session = sessions.get(decoded.sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessions.delete(decoded.sessionId);
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return res.status(401).json({ success: false, message: 'Session expired or invalid.' });
    }

    req.user = session.user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (err) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based Middleware Guards
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Super Admin access required.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  const { schoolId } = req.params;
  if (req.user.role !== 'admin' || (schoolId && req.user.id !== schoolId)) {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
  }
  next();
};

const requireTeacherOrStudentOfTeacher = (req, res, next) => {
  const { teacherId } = req.params;
  if (req.user.role === 'teacher' && req.user.id === teacherId) {
    return next();
  }
  
  if (req.method === 'GET' && req.user.role === 'student' && req.user.teacher_id === teacherId) {
    return next();
  }
  
  return res.status(403).json({ success: false, message: 'Forbidden. Unauthorized access.' });
};

const requireStudent = (req, res, next) => {
  const { student_id } = req.body;
  if (req.user.role !== 'student' || (student_id && req.user.id !== student_id)) {
    return res.status(403).json({ success: false, message: 'Forbidden. Student access required.' });
  }
  next();
};

const requireStudentOfSchool = (req, res, next) => {
  const { schoolId } = req.params;
  if (req.user.role !== 'student' || (schoolId && req.user.school_id !== schoolId)) {
    return res.status(403).json({ success: false, message: 'Forbidden. Unauthorized school map access.' });
  }
  next();
};


// Setup Multer for Blueprint Uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// --- API ROUTES ---

// Helper to set session and JWT cookie
const setSessionAndCookie = (res, userPayload) => {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    user: userPayload,
    expiresAt: Date.now() + SESSION_EXPIRY_MS
  });

  const token = jwt.sign({ sessionId }, process.env.JWT_SECRET || 'super_secret_jwt_key_123', {
    expiresIn: '24h'
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_MS
  });
};

// 1. Unified Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    // 1. Check users table (super_admin and teacher)
    const userResult = await db.query(
      `SELECT u.*, s.name as school_name 
       FROM users u 
       LEFT JOIN schools s ON u.school_id = s.id 
       WHERE u.username = $1 AND u.password = $2`,
      [username, password]
    );

    if (userResult.rowCount > 0) {
      const user = userResult.rows[0];
      if (user.role === 'super_admin') {
        const userPayload = { id: user.id, username: user.username, role: 'super_admin' };
        setSessionAndCookie(res, userPayload);
        return res.json({ success: true, user: userPayload });
      } else if (user.role === 'teacher') {
        const userPayload = { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: 'teacher', 
          school_id: user.school_id, 
          class_assigned: user.class_assigned,
          school_name: user.school_name || ''
        };
        setSessionAndCookie(res, userPayload);
        return res.json({ 
          success: true, 
          user: userPayload
        });
      }
    }

    // 2. Check schools table (admin / school admin)
    const schoolResult = await db.query(
      'SELECT * FROM schools WHERE unique_code = $1 AND password = $2',
      [username, password]
    );

    if (schoolResult.rowCount > 0) {
      const school = schoolResult.rows[0];
      const userPayload = { id: school.id, name: school.name, unique_code: school.unique_code, role: 'admin' };
      setSessionAndCookie(res, userPayload);
      return res.json({ success: true, user: userPayload });
    }

    // 3. Check students table (student)
    const studentResult = await db.query(
      `SELECT st.*, s.name as school_name, u.name as teacher_name, u.class_assigned
       FROM students st
       LEFT JOIN schools s ON st.school_id = s.id
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE st.roll_no = $1 AND (LOWER(TRIM(st.password)) = LOWER(TRIM($2)) OR LOWER(TRIM(st.name)) = LOWER(TRIM($2)))`,
      [username, password]
    );

    if (studentResult.rowCount > 0) {
      const student = studentResult.rows[0];
      const userPayload = {
        id: student.id,
        roll_no: student.roll_no,
        name: student.name,
        role: 'student',
        school_id: student.school_id,
        school_name: student.school_name || '',
        teacher_id: student.teacher_id,
        teacher_name: student.teacher_name || '',
        class_assigned: student.class_assigned || 'General'
      };
      setSessionAndCookie(res, userPayload);
      return res.json({
        success: true,
        user: userPayload
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your details.' });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ success: false, message: 'Server database error during login' });
  }
});

// Session restoration endpoint
app.get('/api/auth/session', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_123');
      sessions.delete(decoded.sessionId);
    } catch (err) {
      // Ignore token verification errors during logout
    }
  }
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});


// 2. Super Admin APIs
app.get('/api/superadmin/schools', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher')::int as teacher_count,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id)::int as student_count
      FROM schools s
      ORDER BY s.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching schools", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/superadmin/schools', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { name, unique_code, password } = req.body;
  try {
    // Check if unique_code exists
    const codeCheck = await db.query('SELECT 1 FROM schools WHERE unique_code = $1', [unique_code]);
    if (codeCheck.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'School unique ID already exists.' });
    }

    const newSchoolId = `school_${Date.now()}`;
    const insertResult = await db.query(
      `INSERT INTO schools (id, name, unique_code, password, blueprint_json)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [newSchoolId, name, unique_code, password, null]
    );
    res.json({ success: true, school: insertResult.rows[0] });
  } catch (err) {
    console.error("Error creating school", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// 3. School Admin APIs
app.get('/api/admin/:schoolId/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  const { schoolId } = req.params;
  try {
    const schoolRes = await db.query('SELECT name, blueprint_json FROM schools WHERE id = $1', [schoolId]);
    if (schoolRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const school = schoolRes.rows[0];

    const teachersRes = await db.query(
      `SELECT id, username, name, class_assigned 
       FROM users 
       WHERE school_id = $1 AND role = 'teacher'
       ORDER BY name ASC`,
      [schoolId]
    );
    const teachers = teachersRes.rows;

    const studentsRes = await db.query(
      `SELECT id, roll_no, name, teacher_id 
       FROM students 
       WHERE school_id = $1`,
      [schoolId]
    );
    const students = studentsRes.rows;

    const scoresRes = await db.query(
      `SELECT sc.* 
       FROM scores sc
       JOIN students st ON sc.student_id = st.id
       WHERE st.school_id = $1`,
      [schoolId]
    );
    const scores = scoresRes.rows;

    const dashboardData = teachers.map(teacher => {
      const myStudents = students.filter(st => st.teacher_id === teacher.id);
      const studentsWithScores = myStudents.map(student => {
        const studentScores = scores.filter(sc => sc.student_id === student.id);
        return {
          ...student,
          scores: studentScores
        };
      });
      return {
        teacher_id: teacher.id,
        teacher_username: teacher.username,
        teacher_name: teacher.name,
        class_assigned: teacher.class_assigned,
        students: studentsWithScores
      };
    });

    res.json({
      school_name: school.name,
      blueprint_uploaded: !!school.blueprint_json,
      blueprint_json: school.blueprint_json,
      teachers: dashboardData
    });
  } catch (err) {
    console.error("Error fetching school dashboard", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Create Teacher account
app.post('/api/admin/:schoolId/teachers', authenticateToken, requireAdmin, async (req, res) => {
  const { schoolId } = req.params;
  const { username, password, name, class_assigned } = req.body;
  try {
    const userCheck = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'Teacher username already exists.' });
    }

    const newTeacherId = `t_${Date.now()}`;
    const insertResult = await db.query(
      `INSERT INTO users (id, school_id, role, username, password, name, class_assigned)
       VALUES ($1, $2, 'teacher', $3, $4, $5, $6) RETURNING *`,
      [newTeacherId, schoolId, username, password, name, class_assigned]
    );
    res.json({ success: true, teacher: insertResult.rows[0] });
  } catch (err) {
    console.error("Error creating teacher", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Modify/Assign Teacher Class (or toggle status)
app.put('/api/admin/:schoolId/teachers/:teacherId', authenticateToken, requireAdmin, async (req, res) => {
  const { teacherId } = req.params;
  const { name, password, class_assigned } = req.body;
  try {
    const selectRes = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher']);
    if (selectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const currentTeacher = selectRes.rows[0];
    const updateName = name || currentTeacher.name;
    const updateClass = class_assigned !== undefined ? class_assigned : currentTeacher.class_assigned;
    const updatePassword = password || currentTeacher.password;

    const updateResult = await db.query(
      `UPDATE users 
       SET name = $1, class_assigned = $2, password = $3
       WHERE id = $4 AND role = 'teacher' RETURNING *`,
      [updateName, updateClass, updatePassword, teacherId]
    );

    res.json({ success: true, teacher: updateResult.rows[0] });
  } catch (err) {
    console.error("Error modifying teacher", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Delete Teacher account
app.delete('/api/admin/:schoolId/teachers/:teacherId', authenticateToken, requireAdmin, async (req, res) => {
  const { teacherId } = req.params;
  try {
    // Delete students assigned to this teacher to clean up orphaned records (matching original db behavior)
    await db.query('DELETE FROM students WHERE teacher_id = $1', [teacherId]);
    await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher']);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting teacher", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Blueprint Upload & AI Generation Endpoint
app.post('/api/admin/:schoolId/blueprint', authenticateToken, requireAdmin, upload.single('blueprint'), async (req, res) => {
  const { schoolId } = req.params;
  try {
    const schoolCheck = await db.query('SELECT 1 FROM schools WHERE id = $1', [schoolId]);
    if (schoolCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Simulate an AI parser generating a 12x10 grid floor plan
    const simulatedMap = {
      width: 12,
      height: 10,
      grid: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 2, 0, 1, 0, 4, 0, 0, 2, 0, 1],
        [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 3, 1, 1, 1, 1, 1, 3, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 2, 0, 0, 0, 0, 0, 0, 4, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 5, 5, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ],
      rooms: [
        { name: "Classroom A", x1: 1, y1: 1, x2: 3, y2: 3 },
        { name: "Hallway Upper", x1: 5, y1: 1, x2: 10, y2: 3 },
        { name: "Classroom B", x1: 1, y1: 5, x2: 3, y2: 8 },
        { name: "Assembly Yard (Safe)", x1: 5, y1: 8, x2: 7, y2: 8 }
      ],
      elements: {
        extinguishers: [
          { x: 2, y: 2 },
          { x: 9, y: 2 },
          { x: 2, y: 6 }
        ],
        doors: [
          { x: 2, y: 4 },
          { x: 8, y: 4 }
        ],
        assembly_zone: { x: 5, y: 8 }
      }
    };

    await db.query('UPDATE schools SET blueprint_json = $1 WHERE id = $2', [JSON.stringify(simulatedMap), schoolId]);
    res.json({
      success: true,
      message: 'AI has successfully mapped the school layout!',
      blueprint_json: simulatedMap
    });
  } catch (err) {
    console.error("Error uploading blueprint", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Update Blueprint JSON directly (Visual Floorplan Editor modifications)
app.put('/api/admin/:schoolId/blueprint', authenticateToken, requireAdmin, async (req, res) => {
  const { schoolId } = req.params;
  const { blueprint_json } = req.body;
  try {
    const schoolCheck = await db.query('SELECT 1 FROM schools WHERE id = $1', [schoolId]);
    if (schoolCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    await db.query('UPDATE schools SET blueprint_json = $1 WHERE id = $2', [JSON.stringify(blueprint_json), schoolId]);
    res.json({ success: true, blueprint_json });
  } catch (err) {
    console.error("Error updating blueprint", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// 4. Teacher APIs
app.get('/api/teacher/:teacherId/students', authenticateToken, requireTeacherOrStudentOfTeacher, async (req, res) => {
  const { teacherId } = req.params;
  try {
    const studentsRes = await db.query(
      'SELECT id, roll_no, name, school_id, teacher_id FROM students WHERE teacher_id = $1 ORDER BY roll_no::int ASC, name ASC',
      [teacherId]
    );
    const students = studentsRes.rows;

    const scoresRes = await db.query(
      `SELECT sc.* 
       FROM scores sc
       JOIN students st ON sc.student_id = st.id
       WHERE st.teacher_id = $1
       ORDER BY sc.timestamp DESC`,
      [teacherId]
    );
    const scores = scoresRes.rows;

    const studentsWithScores = students.map(student => {
      const studentScores = scores.filter(sc => sc.student_id === student.id);
      return {
        ...student,
        scores: studentScores
      };
    });

    res.json({ students: studentsWithScores });
  } catch (err) {
    console.error("Error getting teacher students", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Add Single Student
app.post('/api/teacher/:teacherId/students', authenticateToken, requireTeacherOrStudentOfTeacher, async (req, res) => {
  const { teacherId } = req.params;
  const { name, roll_no, school_id } = req.body;
  try {
    // Check if roll number already exists in this school
    const checkRes = await db.query(
      'SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2',
      [school_id, roll_no]
    );
    if (checkRes.rowCount > 0) {
      return res.status(400).json({ success: false, message: `Roll number ${roll_no} already exists in this school.` });
    }

    const newStudentId = `s_${Date.now()}`;
    const insertRes = await db.query(
      `INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [newStudentId, school_id, teacherId, roll_no, name, name] // Password is full name itself as per guidelines
    );

    res.json({ success: true, student: insertRes.rows[0] });
  } catch (err) {
    console.error("Error adding student", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Bulk Import Students via JSON (CSV parsed on client side)
app.post('/api/teacher/:teacherId/students/bulk', authenticateToken, requireTeacherOrStudentOfTeacher, async (req, res) => {
  const { teacherId } = req.params;
  const { students, school_id } = req.body; // students array of {name, roll_no}
  try {
    let addedCount = 0;
    let skippedCount = 0;

    for (const st of students) {
      const cleanRoll = st.roll_no.toString().trim();
      const cleanName = st.name.trim();

      if (!cleanRoll || !cleanName) {
        skippedCount++;
        continue;
      }

      // Check duplicate
      const checkRes = await db.query(
        'SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2',
        [school_id, cleanRoll]
      );

      if (checkRes.rowCount === 0) {
        const randId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db.query(
          `INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randId, school_id, teacherId, cleanRoll, cleanName, cleanName]
        );
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({ success: true, addedCount, skippedCount });
  } catch (err) {
    console.error("Error bulk importing students", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Delete Student
app.delete('/api/teacher/:teacherId/students/:studentId', authenticateToken, requireTeacherOrStudentOfTeacher, async (req, res) => {
  const { studentId } = req.params;
  try {
    // scores will be deleted via ON DELETE CASCADE in db schema
    await db.query('DELETE FROM students WHERE id = $1', [studentId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting student", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// 5. Student & Gameplay APIs
// Get Quiz
app.get('/api/quizzes/:disasterType', authenticateToken, async (req, res) => {
  const { disasterType } = req.params;
  try {
    const quizRes = await db.query('SELECT * FROM quizzes WHERE disaster_type = $1', [disasterType]);
    if (quizRes.rowCount > 0) {
      return res.json(quizRes.rows[0]);
    }
    res.status(404).json({ message: 'Quiz not found' });
  } catch (err) {
    console.error("Error getting quiz", err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Submit Score
app.post('/api/student/score', authenticateToken, requireStudent, async (req, res) => {
  const { student_id, disaster_type, activity_type, score, duration_seconds } = req.body;
  try {
    const newScoreId = `sc_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const insertRes = await db.query(
      `INSERT INTO scores (id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [newScoreId, student_id, disaster_type, activity_type, score, duration_seconds, timestamp]
    );

    res.json({ success: true, score: insertRes.rows[0] });
  } catch (err) {
    console.error("Error submitting score", err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Fetch School Map for Gamification
app.get('/api/student/:schoolId/map', authenticateToken, requireStudentOfSchool, async (req, res) => {
  const { schoolId } = req.params;
  try {
    const schoolRes = await db.query('SELECT blueprint_json FROM schools WHERE id = $1', [schoolId]);
    if (schoolRes.rowCount > 0 && schoolRes.rows[0].blueprint_json) {
      return res.json(schoolRes.rows[0].blueprint_json);
    }
    res.status(404).json({ message: 'School map not uploaded or ready yet.' });
  } catch (err) {
    console.error("Error getting school map", err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Launch server
app.listen(PORT, () => {
  console.log(`Disaster preparedness server is running on http://localhost:${PORT}`);
});
