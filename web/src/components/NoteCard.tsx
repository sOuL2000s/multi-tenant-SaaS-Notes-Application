import React from 'react';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content?: string;
    createdAt: string;
  };
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
      <p className="text-gray-600 mt-2 text-sm">{note.content}</p>
      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
        <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
        <button
          onClick={() => onDelete(note.id)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default NoteCard;