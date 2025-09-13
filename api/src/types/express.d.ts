// This file extends the Express Request type.
// It must be placed in a .d.ts file and included by tsconfig.json to be picked up globally.
// This allows req.user to be type-safe after the authenticateJWT middleware.

import { AuthTokenPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}