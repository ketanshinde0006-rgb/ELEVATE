import prisma from '../src/config/database.js';

async function main() {
  console.log('Applying safe schema update for auth fields...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`user\`
        ADD COLUMN \`emailVerified\` BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN \`googleId\` VARCHAR(191) NULL,
        ADD COLUMN \`provider\` ENUM('LOCAL', 'GOOGLE', 'BOTH') NOT NULL DEFAULT 'LOCAL',
        MODIFY \`password\` VARCHAR(191) NULL
    `);
    console.log('✓ Columns altered successfully.');
  } catch (err) {
    console.log('Notice on alter (may already exist):', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX \`User_googleId_key\` ON \`user\`(\`googleId\`)
    `);
    console.log('✓ Unique index User_googleId_key created.');
  } catch (err) {
    console.log('Index note (may already exist):', err.message);
  }

  console.log('Schema change finished.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
