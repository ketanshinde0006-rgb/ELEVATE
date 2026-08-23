import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from local or parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Auto-map Railway's MySQL variables to DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_PUBLIC_URL;
}

console.log('🚀 Starting ELEVATE cloud server...');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is available. Syncing schema...');
  try {
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname, '..'),
      env: process.env 
    });
    console.log('🌱 Seeding database initial records...');
    execSync('node prisma/seed.js', { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname, '..'),
      env: process.env 
    });
  } catch (error) {
    console.error('⚠️ Database sync/seed note:', error.message);
  }
} else {
  console.warn('⚠️ No DATABASE_URL found in environment.');
}

// Start the Express application
import('../src/index.js');
