import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { CreateNoteInput, UpdateNoteInput } from './notes.validation';

export async function createNote(req: Request<{}, {}, CreateNoteInput>, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const { title, content } = req.body;

  try {
    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: req.user.tenantId,
        userId: req.user.userId,
      },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getNotes(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const notes = await prisma.note.findMany({
      where: {
        tenantId: req.user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getNoteById(req: Request<{ id: string }>, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const { id } = req.params;

  try {
    const note = await prisma.note.findUnique({
      where: {
        id,
        tenantId: req.user.tenantId, // Ensure note belongs to the user's tenant
      },
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or not accessible' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateNote(req: Request<{ id: string }, {}, UpdateNoteInput>, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const updatedNote = await prisma.note.updateMany({ // Use updateMany to implicitly check tenantId
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      data: {
        title,
        content,
      },
    });

    if (updatedNote.count === 0) {
      return res.status(404).json({ message: 'Note not found or not accessible' });
    }

    // Fetch the updated note to return it
    const note = await prisma.note.findUnique({ where: { id } });
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteNote(req: Request<{ id: string }>, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const { id } = req.params;

  try {
    const deletedNote = await prisma.note.deleteMany({ // Use deleteMany to implicitly check tenantId
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (deletedNote.count === 0) {
      return res.status(404).json({ message: 'Note not found or not accessible' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}