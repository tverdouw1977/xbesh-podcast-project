import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Favorite, Episode } from '../types';
import { Clock, Calendar } from 'lucide-react';

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            *,
            episode:episodes(
              *,
              podcast:podcasts(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setFavorites(data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load your favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <h1 className="text-3xl font-bold mb-8">Your Favorites</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl text-gray-600 mb-4">You haven't favorited any episodes yet</h2>
          <p className="text-gray-500 mb-6">Mark episodes as favorites to easily find them later</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Discover podcasts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((favorite) => {
            const episode = favorite.episode;
            if (!episode) return null;
            
            return (
              <div
                key={favorite.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="md:flex">
                    <div className="md:w-1/6 flex-shrink-0 mb-4 md:mb-0">
                      <Link to={`/podcasts/${episode.podcast?.id}`}>
                        <img
                          src={episode.podcast?.cover_image_url || 'https://via.placeholder.com/100x100?text=No+Image'}
                          alt={episode.podcast?.title}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </Link>
                    </div>
                    <div className="md:w-5/6 md:pl-6">
                      <Link to={`/episodes/${episode.id}`} className="hover:underline">
                        <h2 className="text-xl font-semibold">{episode.title}</h2>
                      </Link>
                      <Link to={`/podcasts/${episode.podcast?.id}`} className="text-blue-600 hover:underline">
                        <p className="text-sm">{episode.podcast?.title}</p>
                      </Link>
                      <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                        <span className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          {formatDuration(episode.duration)}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {formatDate(episode.published_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-gray-700 line-clamp-2">{episode.description}</p>
                      <div className="mt-4">
                        <Link
                          to={`/episodes/${episode.id}`}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Listen now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
