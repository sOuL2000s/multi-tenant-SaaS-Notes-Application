import React, { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import NoteCard from '../components/NoteCard';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO';
}

const DashboardPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/notes');
      setNotes(response.data);
    } catch (err: any) {
      console.error('Failed to fetch notes:', err);
      setError(err.response?.data?.message || 'Failed to fetch notes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantInfo = async () => {
    if (!user) return;
    try {
      // Assuming a GET /api/tenants/:slug endpoint or including tenant info in user data
      // For this demo, we'll use a dummy endpoint or rely on user context
      // In a real app, you might have an endpoint like /api/me/tenant or /api/tenants/:slug
      const response = await apiClient.get(`/tenants/${user.tenantSlug}`); // Assuming this endpoint exists, or adapting
      setTenantInfo(response.data.tenant);
      updateUser({ plan: response.data.tenant.plan }); // Update user context with latest plan
    } catch (err) {
      console.error('Failed to fetch tenant info:', err);
      // Fallback to user context if API fails
      setTenantInfo({
        id: user.tenantId,
        name: user.tenantName,
        slug: user.tenantSlug,
        plan: user.plan,
      });
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchTenantInfo(); // Fetch tenant info on component mount
  }, [user]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    setError(null);
    try {
      const response = await apiClient.post('/notes', {
        title: newNoteTitle,
        content: newNoteContent,
      });
      setNotes([response.data, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      fetchNotes(); // Re-fetch notes to ensure accurate count for limits
      fetchTenantInfo(); // Re-fetch tenant info to check for plan updates
    } catch (err: any) {
      console.error('Failed to create note:', err);
      setError(err.response?.data?.message || 'Failed to create note.');
    }
  };

  const handleDeleteNote = async (id: string) => {
    setError(null);
    try {
      await apiClient.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note.id !== id));
      fetchNotes(); // Re-fetch notes to ensure accurate count for limits
      fetchTenantInfo(); // Re-fetch tenant info to check for plan updates
    } catch (err: any) {
      console.error('Failed to delete note:', err);
      setError(err.response?.data?.message || 'Failed to delete note.');
    }
  };

  const handleUpgradePlan = async () => {
    if (!user || user.role !== 'ADMIN' || !tenantInfo) return;
    setError(null);
    try {
      const response = await apiClient.post(`/tenants/${user.tenantSlug}/upgrade`);
      alert(response.data.message);
      fetchTenantInfo(); // Re-fetch to update plan status
    } catch (err: any) {
      console.error('Failed to upgrade plan:', err);
      setError(err.response?.data?.message || 'Failed to upgrade plan.');
    }
  };

  if (loading) {
    return <p className="text-gray-700">Loading notes...</p>;
  }

  const isFreePlan = tenantInfo?.plan === 'FREE';
  const hasReachedLimit = isFreePlan && notes.length >= 3;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {user?.tenantName || 'Your'} Notes
        </h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {tenantInfo && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800">
          <p className="font-semibold">Tenant: {tenantInfo.name}</p>
          <p>Plan: <span className={`font-bold ${tenantInfo.plan === 'PRO' ? 'text-green-600' : 'text-orange-600'}`}>{tenantInfo.plan}</span></p>
          {isFreePlan && (
            <p className="mt-2 text-sm">You have {notes.length} of 3 notes used. Upgrade to Pro for unlimited notes.</p>
          )}
          {isFreePlan && isAdmin && (
            <button
              onClick={handleUpgradePlan}
              className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleCreateNote} className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create New Note</h2>
        <input
          type="text"
          placeholder="Note Title"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-3 focus:ring-blue-500 focus:border-blue-500"
          disabled={hasReachedLimit && !isAdmin} // Disable for free users at limit
        />
        <textarea
          placeholder="Note Content (optional)"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500 resize-y"
          disabled={hasReachedLimit && !isAdmin} // Disable for free users at limit
        ></textarea>
        <button
          type="submit"
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors
            ${hasReachedLimit && !isAdmin
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
          disabled={hasReachedLimit && !isAdmin}
        >
          {hasReachedLimit && !isAdmin ? 'Limit Reached - Upgrade to Pro' : 'Add Note'}
        </button>
      </form>

      <div className="grid gap-6">
        {notes.length === 0 ? (
          <p className="text-gray-600 text-center">No notes found. Start by creating one!</p>
        ) : (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardPage;