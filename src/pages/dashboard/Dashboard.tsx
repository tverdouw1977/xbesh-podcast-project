import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Podcast } from '../../types';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserPodcasts = async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPodcasts(data || []);
      } catch (err) {
        console.error('Error fetching podcasts:', err);
        setError('Failed to load your podcasts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPodcasts();
  }, [user, navigate]);

  const handleDeletePodcast = async (podcastId: string) => {
    if (!confirm('Are you sure you want to delete this podcast? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the podcast
      const { error } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', podcastId);

      if (error) {
        throw error;
      }

      // Update the UI
      setPodcasts(podcasts.filter(podcast => podcast.id !== podcastId));
    } catch (err) {
      console.error('Error deleting podcast:', err);
      alert('Failed to delete podcast');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <Link to="/dashboard/podcasts/new" className="inline-block">
          <Button className="flex items-center bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md">
            <Plus size={18} className="mr-2" />
            New Podcast
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Podcasts</h2>

          {podcasts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">You haven't created any podcasts yet.</p>
              <Link to="/dashboard/podcasts/new" className="mt-4 inline-block text-blue-600 hover:underline">
                Create your first podcast
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Podcast
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Episodes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {podcasts.map((podcast) => (
                    <tr key={podcast.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={podcast.cover_image_url || 'https://via.placeholder.com/40x40?text=P'}
                              alt={podcast.title}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {podcast.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/dashboard/podcasts/${podcast.id}/episodes`}
                          className="text-blue-600 hover:underline"
                        >
                          Manage Episodes
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(podcast.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/dashboard/podcasts/${podcast.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeletePodcast(podcast.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
