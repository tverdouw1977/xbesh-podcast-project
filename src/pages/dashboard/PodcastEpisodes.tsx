import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Podcast, Episode } from '../../types';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, ArrowLeft, Clock } from 'lucide-react';

const PodcastEpisodes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPodcastAndEpisodes = async () => {
      try {
        // Fetch podcast details
        const { data: podcastData, error: podcastError } = await supabase
          .from('podcasts')
          .select('*')
          .eq('id', id)
          .single();

        if (podcastError) throw podcastError;
        
        // Verify ownership
        if (podcastData.author_id !== user.id) {
          navigate('/dashboard');
          return;
        }

        setPodcast(podcastData);

        // Fetch episodes
        const { data: episodesData, error: episodesError } = await supabase
          .from('episodes')
          .select('*')
          .eq('podcast_id', id)
          .order('published_at', { ascending: false });

        if (episodesError) throw episodesError;
        setEpisodes(episodesData || []);
      } catch (err) {
        console.error('Error fetching podcast details:', err);
        setError('Failed to load podcast details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPodcastAndEpisodes();
    }
  }, [id, user, navigate]);

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!confirm('Are you sure you want to delete this episode? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the episode
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (error) {
        throw error;
      }

      // Update the UI
      setEpisodes(episodes.filter(episode => episode.id !== episodeId));
    } catch (err) {
      console.error('Error deleting episode:', err);
      alert('Failed to delete episode');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (error || !podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Podcast not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{podcast.title}</h1>
          <p className="text-gray-600 mt-1">Manage Episodes</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to={`/dashboard/podcasts/${podcast.id}/episodes/new`}>
            <Button className="flex items-center">
              <Plus size={18} className="mr-2" />
              New Episode
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {episodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">You haven't created any episodes yet.</p>
              <Link
                to={`/dashboard/podcasts/${podcast.id}/episodes/new`}
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                Create your first episode
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Episode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {episodes.map((episode) => (
                    <tr key={episode.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {episode.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {episode.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={16} className="mr-1" />
                          {formatDuration(episode.duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(episode.published_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/dashboard/podcasts/${podcast.id}/episodes/${episode.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteEpisode(episode.id)}
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

export default PodcastEpisodes;
