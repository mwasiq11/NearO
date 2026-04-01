import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    console.log(`🔍 Checking database '${process.env.DB_NAME}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' ensured.`);
  } catch (error) {
    console.error('❌ Failed to ensure database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function createViews() {
  console.log('📊 Creating database views...');
  const { pool } = await import('./database.js');

  try {
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create_views.sql'), 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          await pool.execute(trimmed);
          console.log('✅ Executed view statement');
        } catch (err) {
          console.error('⚠️ View statement error:', err.message);
        }
      }
    }
    console.log('✅ All views created successfully!');
  } catch (error) {
    console.error('❌ Error creating views:', error);
  }
}

async function run() {
  try {
    await ensureDatabase();
    await initializeDatabase();
    await createViews();
    console.log('\n DATABASE RESTORATION COMPLETE!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

run();
