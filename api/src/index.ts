import { app } from './server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function handler
export default async function (req: VercelRequest, res: VercelResponse) {
  // Pass the Vercel request/response objects to Express
  app(req, res);
}