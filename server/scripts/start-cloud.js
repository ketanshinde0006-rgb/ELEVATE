import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Map any Railway MySQL variable to DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_PUBLIC_URL;
}

console.log('🚀 Booting ELEVATE server (DATABASE_URL configured:', Boolean(process.env.DATABASE_URL), ')...');

// Start Express server immediately so Railway healthcheck and HTTP proxy activate instantly
import('../src/index.js').then(() => {
  if (process.env.DATABASE_URL) {
    console.log('🔄 Triggering background schema sync & seed...');
    exec('npx prisma db push --accept-data-loss --skip-generate && node prisma/seed.js', {
      cwd: path.resolve(__dirname, '..'),
      env: process.env,
    }, (err, stdout, stderr) => {
      if (err) {
        console.error('⚠️ DB sync note:', err.message);
      } else {
        console.log('✅ DB synced and seeded successfully!');
      }
      if (stdout) console.log(stdout.trim());
    });
  }
}).catch((err) => {
  console.error('❌ Failed to start application:', err);
});
