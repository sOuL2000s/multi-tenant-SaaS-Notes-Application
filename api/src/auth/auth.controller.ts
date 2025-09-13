import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../lib/jwt';
import prisma from '../lib/prisma';
import { LoginInput } from './auth.validation';

export async function login(req: Request<{}, {}, LoginInput>, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({ // Use findFirst to handle unique constraint on email_tenantId
      where: { email },
      include: {
        tenant: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    });

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, tenantName: user.tenant.name, tenantSlug: user.tenant.slug } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  const user = await prisma.user.findFirst({
  where: { email },
  include: {
    tenant: true
  }
});

console.log('User found for email:', email, '->', user ? user.id : 'No user');
if (user) {
  console.log('Password from request:', password);
  console.log('Hashed password from DB:', user.passwordHash);
}

if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return res.status(401).json({ message: 'Invalid credentials' });
}
}