import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { TenantPlan } from '@prisma/client';
import { UpgradeTenantPlanInput } from './tenants.validation';

export async function upgradeTenantPlan(req: Request<UpgradeTenantPlanInput['params']>, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { slug } = req.params;

  try {
    // Find the tenant by slug
    const tenantToUpgrade = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, plan: true }
    });

    if (!tenantToUpgrade) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Ensure the admin user can only upgrade their own tenant
    if (tenantToUpgrade.id !== req.user.tenantId) {
      return res.status(403).json({ message: 'You are not authorized to upgrade this tenant' });
    }

    if (tenantToUpgrade.plan === TenantPlan.PRO) {
      return res.status(200).json({ message: 'Tenant is already on Pro plan', tenant: tenantToUpgrade });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantToUpgrade.id },
      data: { plan: TenantPlan.PRO },
      select: { id: true, name: true, slug: true, plan: true }
    });

    res.json({ message: `${updatedTenant.name} successfully upgraded to Pro plan.`, tenant: updatedTenant });
  } catch (error) {
    console.error('Error upgrading tenant plan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}