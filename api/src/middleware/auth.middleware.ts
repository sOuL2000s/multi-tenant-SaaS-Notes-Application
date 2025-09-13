import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthTokenPayload } from '../lib/jwt';
import { UserRole, TenantPlan } from '@prisma/client';
import prisma from '../lib/prisma';

// Extend the Request type to include user information
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload;
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = verifyToken(token);
    req.user = user; // Attach user payload to the request
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function authorizeRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export async function checkSubscriptionLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.plan === TenantPlan.FREE) {
      const notesCount = await prisma.note.count({
        where: {
          tenantId: req.user.tenantId,
        },
      });

      if (notesCount >= 3) {
        return res.status(403).json({ message: 'Free plan limit reached (max 3 notes). Upgrade to Pro for unlimited notes.' });
      }
    }
    next();
  } catch (error) {
    console.error('Error checking subscription limit:', error);
    res.status(500).json({ message: 'Internal server error while checking subscription' });
  }
}