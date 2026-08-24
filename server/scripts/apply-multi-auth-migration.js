import prisma from '../src/config/database.js';

async function migrate() {
  console.log('Applying safe non-destructive multi-auth database alterations...');

  // 1. Add User columns safely
  const userColumns = [
    { name: 'phoneVerified', type: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'twoFactorEnabled', type: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'twoFactorSecret', type: 'TEXT NULL' },
    { name: 'recoveryCodes', type: 'TEXT NULL' },
    { name: 'failedLoginAttempts', type: 'INT NOT NULL DEFAULT 0' },
    { name: 'lockoutUntil', type: 'DATETIME(3) NULL' },
  ];

  for (const col of userColumns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`User\` ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`  ✓ Added column ${col.name} to User`);
    } catch (err) {
      if (err.message?.includes('Duplicate column name')) {
        console.log(`  - Column ${col.name} already exists on User`);
      } else {
        console.warn(`  ! Column ${col.name}:`, err.message);
      }
    }
  }

  // 2. Create AuthIdentity table if not exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`AuthIdentity\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`provider\` ENUM('LOCAL', 'GOOGLE', 'APPLE', 'MICROSOFT', 'PHONE') NOT NULL,
        \`providerAccountId\` VARCHAR(191) NOT NULL,
        \`email\` VARCHAR(191) NULL,
        \`phone\` VARCHAR(191) NULL,
        \`profileData\` TEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`AuthIdentity_provider_providerAccountId_key\` (\`provider\`, \`providerAccountId\`),
        INDEX \`AuthIdentity_userId_idx\` (\`userId\`),
        INDEX \`AuthIdentity_provider_email_idx\` (\`provider\`, \`email\`),
        INDEX \`AuthIdentity_provider_phone_idx\` (\`provider\`, \`phone\`),
        CONSTRAINT \`AuthIdentity_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Created/verified AuthIdentity table');
  } catch (err) {
    console.warn('  ! AuthIdentity table creation:', err.message);
  }

  // 3. Create VerificationToken table if not exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`VerificationToken\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NULL,
        \`identifier\` VARCHAR(191) NOT NULL,
        \`type\` ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_OTP', 'MAGIC_LINK') NOT NULL,
        \`tokenHash\` VARCHAR(500) NOT NULL,
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`attempts\` INT NOT NULL DEFAULT 0,
        \`maxAttempts\` INT NOT NULL DEFAULT 5,
        \`consumedAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`VerificationToken_identifier_type_idx\` (\`identifier\`, \`type\`),
        INDEX \`VerificationToken_tokenHash_idx\` (\`tokenHash\`),
        INDEX \`VerificationToken_userId_idx\` (\`userId\`),
        CONSTRAINT \`VerificationToken_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Created/verified VerificationToken table');
  } catch (err) {
    console.warn('  ! VerificationToken table creation:', err.message);
  }

  // 4. Create Session table if not exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Session\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`tokenHash\` VARCHAR(500) NOT NULL,
        \`userAgent\` TEXT NULL,
        \`ipAddress\` VARCHAR(191) NULL,
        \`device\` VARCHAR(191) NULL,
        \`browser\` VARCHAR(191) NULL,
        \`os\` VARCHAR(191) NULL,
        \`lastActiveAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`revokedAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`Session_tokenHash_key\` (\`tokenHash\`),
        INDEX \`Session_userId_idx\` (\`userId\`),
        CONSTRAINT \`Session_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Created/verified Session table');
  } catch (err) {
    console.warn('  ! Session table creation:', err.message);
  }

  // 5. Populate AuthIdentity for existing users who don't have one yet
  const users = await prisma.user.findMany({
    include: { authIdentities: true },
  });

  for (const u of users) {
    if (u.email && !u.authIdentities.some(i => i.provider === 'LOCAL')) {
      await prisma.authIdentity.create({
        data: {
          userId: u.id,
          provider: 'LOCAL',
          providerAccountId: u.email.toLowerCase(),
          email: u.email.toLowerCase(),
        },
      });
      console.log(`  ✓ Created LOCAL AuthIdentity for existing user ${u.email}`);
    }
  }

  console.log('✅ Safe database migration finished successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
