import { PrismaClient, UserRole, TenantPlan } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create Tenants
  const acme = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      plan: TenantPlan.FREE, // Start as Free plan
    },
  });

  const globex = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex Inc.',
      slug: 'globex',
      plan: TenantPlan.FREE, // Start as Free plan
    },
  });

  console.log({ acme, globex });

  // Create Users for Acme
  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@acme.test', tenantId: acme.id } },
    update: {},
    create: {
      email: 'admin@acme.test',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      tenantId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'user@acme.test', tenantId: acme.id } },
    update: {},
    create: {
      email: 'user@acme.test',
      passwordHash: hashedPassword,
      role: UserRole.MEMBER,
      tenantId: acme.id,
    },
  });

  // Create Users for Globex
  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@globex.test', tenantId: globex.id } },
    update: {},
    create: {
      email: 'admin@globex.test',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      tenantId: globex.id,
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'user@globex.test', tenantId: globex.id } },
    update: {},
    create: {
      email: 'user@globex.test',
      passwordHash: hashedPassword,
      role: UserRole.MEMBER,
      tenantId: globex.id,
    },
  });

  console.log('Users created/updated.');

  // Create some initial notes (optional)
  const acmeUser = await prisma.user.findUnique({
    where: { email_tenantId: { email: 'user@acme.test', tenantId: acme.id } },
  });
  if (acmeUser) {
    await prisma.note.upsert({
      where: { id: 'acme-note-1' }, // Dummy ID for upsert
      update: { title: 'Acme Initial Note 1', content: 'This is the first note for Acme.', userId: acmeUser.id, tenantId: acme.id },
      create: {
        id: 'acme-note-1',
        title: 'Acme Initial Note 1',
        content: 'This is the first note for Acme.',
        userId: acmeUser.id,
        tenantId: acme.id,
      },
    });
    await prisma.note.upsert({
      where: { id: 'acme-note-2' },
      update: { title: 'Acme Initial Note 2', content: 'Another important note for Acme.', userId: acmeUser.id, tenantId: acme.id },
      create: {
        id: 'acme-note-2',
        title: 'Acme Initial Note 2',
        content: 'Another important note for Acme.',
        userId: acmeUser.id,
        tenantId: acme.id,
      },
    });
  }

  const globexAdmin = await prisma.user.findUnique({
    where: { email_tenantId: { email: 'admin@globex.test', tenantId: globex.id } },
  });
  if (globexAdmin) {
    await prisma.note.upsert({
      where: { id: 'globex-note-1' },
      update: { title: 'Globex Admin Note', content: 'Admin created this note for Globex.', userId: globexAdmin.id, tenantId: globex.id },
      create: {
        id: 'globex-note-1',
        title: 'Globex Admin Note',
        content: 'Admin created this note for Globex.',
        userId: globexAdmin.id,
        tenantId: globex.id,
      },
    });
  }

  console.log('Notes created/updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });