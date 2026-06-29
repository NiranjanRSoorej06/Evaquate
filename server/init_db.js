const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT, 10);
const dbName = process.env.DB_NAME;

async function init() {
  // 1. Connect to postgres database to ensure target database exists
  console.log('Connecting to default postgres database...');
  const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
  }

  // 2. Connect to the target database and build schema
  console.log(`Connecting to database "${dbName}"...`);
  const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: dbName,
  });

  try {
    // Create tables
    console.log('Creating tables if they do not exist...');

    // Schools Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unique_code VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        blueprint_json JSONB
      );
    `);

    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        school_id VARCHAR(50) REFERENCES schools(id) ON DELETE SET NULL,
        role VARCHAR(50) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        class_assigned VARCHAR(100)
      );
    `);

    // Students Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        school_id VARCHAR(50) REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        roll_no VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        UNIQUE (school_id, roll_no)
      );
    `);

    // Quizzes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        disaster_type VARCHAR(50) PRIMARY KEY,
        questions JSONB NOT NULL
      );
    `);

    // Scores Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
        disaster_type VARCHAR(50) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        duration_seconds INT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created or already exist.');

    // 3. Migrate data from db.json if database is empty
    const schoolCountResult = await pool.query('SELECT COUNT(*) FROM schools');
    const hasData = parseInt(schoolCountResult.rows[0].count, 10) > 0;

    if (!hasData) {
      console.log('Database is empty. Starting migration from db.json...');
      const dbPath = path.join(__dirname, 'db.json');
      if (fs.existsSync(dbPath)) {
        const rawData = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(rawData);

        // Migrate schools
        if (data.schools && data.schools.length > 0) {
          console.log(`Migrating ${data.schools.length} schools...`);
          for (const school of data.schools) {
            await pool.query(
              `INSERT INTO schools (id, name, unique_code, password, blueprint_json)
               VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
              [school.id, school.name, school.unique_code, school.password, JSON.stringify(school.blueprint_json)]
            );
          }
        }

        // Migrate users
        if (data.users && data.users.length > 0) {
          console.log(`Migrating ${data.users.length} users...`);
          for (const user of data.users) {
            await pool.query(
              `INSERT INTO users (id, school_id, role, username, password, name, class_assigned)
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
              [user.id, user.school_id, user.role, user.username, user.password, user.name, user.class_assigned]
            );
          }
        }

        // Migrate students
        if (data.students && data.students.length > 0) {
          console.log(`Migrating ${data.students.length} students...`);
          for (const student of data.students) {
            await pool.query(
              `INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
              [student.id, student.school_id, student.teacher_id, student.roll_no, student.name, student.password]
            );
          }
        }

        // Migrate quizzes
        if (data.quizzes && data.quizzes.length > 0) {
          console.log(`Migrating ${data.quizzes.length} quizzes...`);
          for (const quiz of data.quizzes) {
            await pool.query(
              `INSERT INTO quizzes (disaster_type, questions)
               VALUES ($1, $2) ON CONFLICT (disaster_type) DO NOTHING`,
              [quiz.disaster_type, JSON.stringify(quiz.questions)]
            );
          }
        }

        // Migrate scores
        if (data.scores && data.scores.length > 0) {
          console.log(`Migrating ${data.scores.length} scores...`);
          for (const score of data.scores) {
            await pool.query(
              `INSERT INTO scores (id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
              [score.id, score.student_id, score.disaster_type, score.activity_type, score.score, score.duration_seconds, score.timestamp]
            );
          }
        }

        console.log('Migration completed successfully.');
      } else {
        console.log('db.json file not found. Skipping data migration.');
      }
    } else {
      console.log('Database already has data. Skipping migration.');
    }
  } catch (err) {
    console.error('Error during database initialization/migration:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
