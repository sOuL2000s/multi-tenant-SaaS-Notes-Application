import { z } from 'zod';

export const upgradeTenantPlanSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Tenant slug is required'),
  }),
});

export type UpgradeTenantPlanInput = z.infer<typeof upgradeTenantPlanSchema>;