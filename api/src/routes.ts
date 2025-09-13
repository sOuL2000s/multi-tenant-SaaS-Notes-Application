import { Router } from 'express';
import { login } from './auth/auth.controller';
import { authenticateJWT, authorizeRole, checkSubscriptionLimit } from './middleware/auth.middleware';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from './notes/notes.controller';
import { upgradeTenantPlan } from './tenants/tenants.controller';
import { validate } from './middleware/validation.middleware';
import { loginSchema } from './auth/auth.validation';
import { createNoteSchema, updateNoteSchema } from './notes/notes.validation';
import { upgradeTenantPlanSchema } from './tenants/tenants.validation';

const router = Router();

// Authentication Routes
router.post('/auth/login', validate(loginSchema), login);

// Health Check (can be outside /api prefix in server.ts, but including here for consistency)
router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Tenant Routes (Admin only)
router.post('/tenants/:slug/upgrade', authenticateJWT, authorizeRole(['ADMIN']), validate(upgradeTenantPlanSchema), upgradeTenantPlan);

// Notes Routes (Member & Admin)
router.post('/notes', authenticateJWT, authorizeRole(['MEMBER', 'ADMIN']), checkSubscriptionLimit, validate(createNoteSchema), createNote);
router.get('/notes', authenticateJWT, authorizeRole(['MEMBER', 'ADMIN']), getNotes);
router.get('/notes/:id', authenticateJWT, authorizeRole(['MEMBER', 'ADMIN']), getNoteById);
router.put('/notes/:id', authenticateJWT, authorizeRole(['MEMBER', 'ADMIN']), validate(updateNoteSchema), updateNote);
router.delete('/notes/:id', authenticateJWT, authorizeRole(['MEMBER', 'ADMIN']), deleteNote);


export { router };